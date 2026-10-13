<?php

namespace App\Services\Providers;

use App\Exceptions\ApiException;
use App\Models\AcademyProfile;
use App\Models\Instructor;
use App\Models\Notification as InAppNotification;
use App\Models\ProviderApplication;
use App\Models\ProviderApplicationDocument;
use App\Models\User;
use App\Notifications\ProviderApplicationStatusNotification;
use App\Services\Operations\OperationRecorder;
use App\Services\Organizations\OrganizationService;
use App\Services\Security\Malware\MalwareScannerInterface;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class ProviderApplicationService
{
    public function __construct(
        private readonly MalwareScannerInterface $scanner,
        private readonly OperationRecorder $recorder,
        private readonly OrganizationService $organizations,
    ) {}

    /**
     * Create or resubmit an instructor application.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function submit(
        User $user,
        array $attributes,
        ?UploadedFile $identityDocument,
        ?UploadedFile $qualificationDocument,
        Request $request,
    ): ProviderApplication {
        $application = ProviderApplication::query()
            ->where('user_id', $user->id)
            ->where('provider_type', $attributes['providerType'])
            ->first();

        if ($application?->status === ProviderApplication::STATUS_APPROVED) {
            throw new ApiException(
                'PROVIDER_ALREADY_APPROVED',
                'This provider application has already been approved.',
                409,
            );
        }

        if ($application?->status === ProviderApplication::STATUS_PENDING_REVIEW) {
            throw new ApiException(
                'PROVIDER_APPLICATION_PENDING',
                'This provider application is already under review.',
                409,
            );
        }

        $files = array_filter([
            'identity' => $identityDocument,
            'qualification' => $qualificationDocument,
        ]);
        foreach ($files as $file) {
            $this->assertClean($file);
        }

        $storedPaths = [];
        $obsoletePaths = [];
        try {
            $application = DB::transaction(function () use (
                $user,
                $attributes,
                $application,
                $files,
                $request,
                &$storedPaths,
                &$obsoletePaths,
            ): ProviderApplication {
                $application ??= new ProviderApplication;
                $application->fill([
                    'user_id' => $user->id,
                    'provider_type' => $attributes['providerType'],
                    'status' => ProviderApplication::STATUS_PENDING_REVIEW,
                    'display_name' => $attributes['displayName'],
                    'phone' => $attributes['phone'],
                    'specialty' => $attributes['specialty'],
                    'years_experience' => $attributes['yearsExperience'],
                    'bio' => $attributes['bio'],
                    'qualifications' => $attributes['qualifications'] ?? null,
                    'portfolio_url' => $attributes['portfolioUrl'] ?? null,
                    'sample_course_title' => $attributes['sampleCourseTitle'],
                    'sample_course_description' => $attributes['sampleCourseDescription'] ?? null,
                    'review_note' => null,
                    'reviewed_by' => null,
                    'reviewed_at' => null,
                    'submitted_at' => now(),
                ])->save();

                foreach ($files as $type => $file) {
                    $storedPaths[] = $this->storeDocument(
                        $application,
                        $type,
                        $file,
                        $obsoletePaths,
                    );
                }

                $this->recorder->record(
                    'provider_application.submitted',
                    'provider_application',
                    $application->id,
                    null,
                    $user->id,
                    ['provider_type' => $application->provider_type],
                    ['applicationId' => $application->id],
                    $request,
                );

                return $application;
            });
        } catch (Throwable $exception) {
            foreach ($storedPaths as [$disk, $path]) {
                Storage::disk($disk)->delete($path);
            }
            throw $exception;
        }
        foreach ($obsoletePaths as [$disk, $path]) {
            Storage::disk($disk)->delete($path);
        }

        $this->notifyPlatformReviewers($application);
        $this->notifyApplicant($application);

        return $application->load('documents');
    }

    public function approve(
        ProviderApplication $application,
        User $reviewer,
        ?string $note,
        Request $request,
    ): ProviderApplication {
        $application = DB::transaction(function () use ($application, $reviewer, $note, $request): ProviderApplication {
            $application = ProviderApplication::query()
                ->lockForUpdate()
                ->findOrFail($application->id);
            $this->assertPending($application);

            $organization = $this->organizations->create(
                $application->user,
                [
                    'name' => $application->display_name,
                    'type' => 'independent_instructor',
                    'bio' => $application->bio,
                ],
                $request,
            );
            AcademyProfile::query()->create([
                'organization_id' => $organization->id,
                'slug' => $organization->slug,
                'public_name' => $application->display_name,
                'public_name_ar' => $application->display_name,
                'description' => $application->bio,
                'description_ar' => $application->bio,
                'phone' => $application->phone,
                'email' => $application->user->email,
                'website' => $application->portfolio_url,
                'delivery_methods' => ['online', 'recorded'],
                'is_public' => true,
                'verification_status' => 'verified',
                'verified_at' => now(),
            ]);
            Instructor::query()->create([
                'organization_id' => $organization->id,
                'user_id' => $application->user_id,
                'name' => $application->display_name,
                'name_ar' => $application->display_name,
                'bio' => $application->bio,
                'bio_ar' => $application->bio,
                'specialties' => [$application->specialty],
                'social_links' => array_filter([
                    'portfolio' => $application->portfolio_url,
                ]),
                'status' => 'active',
            ]);

            $application->update([
                'organization_id' => $organization->id,
                'status' => ProviderApplication::STATUS_APPROVED,
                'review_note' => $note,
                'reviewed_by' => $reviewer->id,
                'reviewed_at' => now(),
            ]);
            $this->recordReview($application, $reviewer, $request);

            return $application;
        });

        $this->notifyApplicant($application);

        return $application->load(['user', 'organization', 'documents', 'reviewer']);
    }

    public function requestChanges(
        ProviderApplication $application,
        User $reviewer,
        string $note,
        Request $request,
    ): ProviderApplication {
        return $this->transition(
            $application,
            $reviewer,
            ProviderApplication::STATUS_NEEDS_CHANGES,
            $note,
            $request,
        );
    }

    public function reject(
        ProviderApplication $application,
        User $reviewer,
        string $note,
        Request $request,
    ): ProviderApplication {
        return $this->transition(
            $application,
            $reviewer,
            ProviderApplication::STATUS_REJECTED,
            $note,
            $request,
        );
    }

    private function transition(
        ProviderApplication $application,
        User $reviewer,
        string $status,
        string $note,
        Request $request,
    ): ProviderApplication {
        $application = DB::transaction(function () use ($application, $reviewer, $status, $note, $request): ProviderApplication {
            $application = ProviderApplication::query()
                ->lockForUpdate()
                ->findOrFail($application->id);
            $this->assertPending($application);
            $application->update([
                'status' => $status,
                'review_note' => $note,
                'reviewed_by' => $reviewer->id,
                'reviewed_at' => now(),
            ]);
            $this->recordReview($application, $reviewer, $request);

            return $application;
        });

        $this->notifyApplicant($application);

        return $application->load(['user', 'documents', 'reviewer']);
    }

    private function assertPending(ProviderApplication $application): void
    {
        if ($application->status !== ProviderApplication::STATUS_PENDING_REVIEW) {
            throw new ApiException(
                'PROVIDER_APPLICATION_INVALID_STATE',
                'Only pending provider applications can be reviewed.',
                409,
            );
        }
    }

    private function assertClean(UploadedFile $file): void
    {
        $result = $this->scanner->scanFile($file->getRealPath());
        if ($result->isInfected()) {
            throw new ApiException(
                'MALWARE_DETECTED',
                'The uploaded document was rejected by the security scanner.',
                422,
            );
        }
        if ($result->hasFailed()) {
            throw new ApiException(
                'FILE_SCAN_FAILED',
                'The document security scan is temporarily unavailable.',
                503,
            );
        }
    }

    /**
     * @return array{string, string}
     */
    private function storeDocument(
        ProviderApplication $application,
        string $type,
        UploadedFile $file,
        array &$obsoletePaths,
    ): array {
        $disk = (string) config('filesystems.default');
        $extension = mb_strtolower($file->guessExtension() ?: 'bin');
        $path = $file->storeAs(
            "provider-applications/{$application->id}",
            Str::uuid().".{$extension}",
            $disk,
        );
        if (! $path) {
            throw new ApiException(
                'FILE_UPLOAD_FAILED',
                'The provider document could not be stored.',
                500,
            );
        }

        $old = $application->documents()->where('type', $type)->first();
        ProviderApplicationDocument::query()->updateOrCreate(
            [
                'provider_application_id' => $application->id,
                'type' => $type,
            ],
            [
                'disk' => $disk,
                'path' => $path,
                'original_name' => $this->safeName($file->getClientOriginalName()),
                'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
                'size_bytes' => $file->getSize(),
                'checksum' => hash_file('sha256', $file->getRealPath()),
                'scan_status' => 'ready',
            ],
        );
        if ($old && ($old->disk !== $disk || $old->getRawOriginal('path') !== $path)) {
            $obsoletePaths[] = [$old->disk, $old->getRawOriginal('path')];
        }

        return [$disk, $path];
    }

    private function safeName(string $name): string
    {
        return Str::limit(
            preg_replace('/[^\pL\pN._ -]+/u', '_', basename($name)) ?: 'document',
            180,
            '',
        );
    }

    private function notifyPlatformReviewers(ProviderApplication $application): void
    {
        User::query()
            ->whereIn('platform_role', ['super_admin', 'platform_moderator'])
            ->pluck('id')
            ->each(fn (string $userId) => InAppNotification::query()->create([
                'user_id' => $userId,
                'type' => 'provider_application_submitted',
                'priority' => 'high',
                'title' => 'طلب مدرس جديد',
                'body' => "{$application->display_name} أرسل طلب اعتماد كمدرس مستقل.",
                'target_type' => 'provider_application',
                'target_id' => $application->id,
                'data' => ['status' => $application->status],
                'status' => 'unread',
            ]));
    }

    private function notifyApplicant(ProviderApplication $application): void
    {
        $copy = match ($application->status) {
            ProviderApplication::STATUS_APPROVED => ['تم قبول طلب المدرس', 'تم تفعيل مساحتك ويمكنك تجهيز أول كورس للمراجعة.'],
            ProviderApplication::STATUS_NEEDS_CHANGES => ['طلب المدرس يحتاج استكمال', 'راجع ملاحظة فريق المراجعة وحدّث الطلب.'],
            ProviderApplication::STATUS_REJECTED => ['تحديث بخصوص طلب المدرس', 'راجع سبب القرار من صفحة طلب الانضمام.'],
            default => ['تم استلام طلب المدرس', 'طلبك قيد المراجعة وسنبلغك عند تحديث حالته.'],
        };
        InAppNotification::query()->create([
            'user_id' => $application->user_id,
            'organization_id' => $application->organization_id,
            'type' => 'provider_application_status',
            'priority' => $application->status === ProviderApplication::STATUS_APPROVED ? 'high' : 'medium',
            'title' => $copy[0],
            'body' => $copy[1],
            'target_type' => 'provider_application',
            'target_id' => $application->id,
            'data' => ['status' => $application->status, 'note' => $application->review_note],
            'status' => 'unread',
        ]);
        $application->user->notify(new ProviderApplicationStatusNotification(
            $application->status,
            $application->review_note,
            rtrim((string) config('app.frontend_url'), '/').'/register-company?type=independent_instructor',
        ));
    }

    private function recordReview(
        ProviderApplication $application,
        User $reviewer,
        Request $request,
    ): void {
        $this->recorder->record(
            "provider_application.{$application->status}",
            'provider_application',
            $application->id,
            $application->organization_id,
            $reviewer->id,
            ['note' => $application->review_note],
            ['applicationId' => $application->id, 'status' => $application->status],
            $request,
        );
    }
}
