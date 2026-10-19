<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\Organization;
use App\Models\User;
use App\Services\Operations\OperationRecorder;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CertificateController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $isOrgAdmin = $request->attributes->has('active_organization');

        $query = Certificate::query()->with([
            'course:id,title,title_ar,cover_image_url',
            'student:id,name,email',
            'organization:id,name,logo_path',
        ]);

        if ($isOrgAdmin) {
            $org = $this->organization($request);
            $query->where('organization_id', $org->id);
            if ($request->filled('courseId')) {
                $query->where('course_id', $request->string('courseId'));
            }
            if ($request->filled('studentId')) {
                $query->where('student_id', $request->string('studentId'));
            }
        } else {
            $query->where('student_id', $user->id);
        }

        $items = $query->orderByDesc('issue_date')->paginate(min($request->integer('perPage', 30), 100));

        return ApiResponse::success($request, $items->items(), [
            'currentPage' => $items->currentPage(),
            'lastPage' => $items->lastPage(),
            'total' => $items->total(),
        ]);
    }

    public function generate(Request $request, OperationRecorder $recorder): JsonResponse
    {
        $org = $this->organization($request);

        $validated = $request->validate([
            'courseId' => ['required', 'uuid', 'exists:courses,id'],
            'studentId' => ['required', 'uuid', 'exists:users,id'],
            'gradeScore' => ['nullable', 'integer', 'min:0', 'max:100'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $course = Course::query()->where('organization_id', $org->id)->findOrFail($validated['courseId']);
        $student = User::query()->findOrFail($validated['studentId']);

        // Check authoritative enrollment status: must be already completed
        $enrollment = CourseEnrollment::query()
            ->where('organization_id', $org->id)
            ->where('course_id', $course->id)
            ->where('student_id', $student->id)
            ->first();

        if (! $enrollment) {
            throw new ApiException('ENROLLMENT_NOT_FOUND', 'Cannot issue certificate: Student has no enrollment record in this course.', 422);
        }

        if ($enrollment->status !== 'completed') {
            throw new ApiException('COURSE_NOT_COMPLETED', 'Cannot issue certificate: Course enrollment is not completed. The student must fulfill all completion requirements before receiving a certificate.', 422);
        }

        // Check if certificate already exists
        $existing = Certificate::query()
            ->where('course_id', $course->id)
            ->where('student_id', $student->id)
            ->first();

        if ($existing) {
            return ApiResponse::success($request, $existing->load(['course', 'student', 'organization']), status: 200);
        }

        $verificationCode = 'CERT-'.strtoupper(Str::random(4)).'-'.strtoupper(Str::random(4));
        $certNumber = 'AIN-'.date('Y').'-'.strtoupper(Str::random(6));

        $certificate = Certificate::query()->create([
            'organization_id' => $org->id,
            'course_id' => $course->id,
            'student_id' => $student->id,
            'certificate_number' => $certNumber,
            'issue_date' => now()->toDateString(),
            'grade_score' => $validated['gradeScore'] ?? 95,
            'verification_code' => $verificationCode,
            'status' => 'issued',
            'metadata' => [
                'courseTitle' => $course->title,
                'courseTitleAr' => $course->title_ar,
                'studentName' => $student->name,
                'organizationName' => $org->name,
                'organizationNameAr' => $org->name,
                'notes' => $validated['notes'] ?? null,
                'is_test' => (bool) ($org->is_test ?? false),
                'is_qa_drill' => (bool) ($org->is_test ?? false),
                'classification' => ($org->is_test ?? false) ? 'QA_TEST_CREDENTIAL' : 'ACADEMIC_CREDENTIAL',
            ],
        ]);

        $recorder->record('certificate.issued', 'certificate', $certificate->id, $org->id, $request->user()->id, [], [
            'verificationCode' => $verificationCode,
        ], $request);

        return ApiResponse::success($request, $certificate->load(['course', 'student', 'organization']), status: 201);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $cert = Certificate::query()->with(['course', 'student', 'organization'])->findOrFail($id);

        $hasAccess = $user->hasRole('super_admin') ||
            $user->id === $cert->student_id ||
            $user->organizationMemberships()
                ->where('organization_id', $cert->organization_id)
                ->whereIn('role_id', function ($query) {
                    $query->select('id')->from('roles')
                        ->whereIn('name', ['organization_owner', 'organization_admin', 'staff', 'instructor']);
                })
                ->exists();

        if (! $hasAccess) {
            throw new ApiException('FORBIDDEN', 'You do not have access to view this certificate.', 403);
        }

        return ApiResponse::success($request, $cert);
    }

    public function revoke(
        Request $request,
        string $organization,
        string $certificate,
        OperationRecorder $recorder,
    ): JsonResponse {
        $org = $this->organization($request);
        $user = $request->user();

        $cert = Certificate::query()
            ->where('organization_id', $org->id)
            ->where(fn ($q) => $q->where('id', $certificate)->orWhere('verification_code', $certificate))
            ->firstOrFail();

        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $metadata = $cert->metadata ?? [];
        $metadata['revoked_at'] = now()->toIso8601String();
        $metadata['revoked_by'] = $user->id;
        $metadata['revocation_reason'] = $validated['reason'] ?? 'Revoked by academy administrator.';

        $cert->update([
            'status' => 'revoked',
            'metadata' => $metadata,
        ]);

        $recorder->record(
            'certificate.revoked',
            'certificate',
            $cert->id,
            $org->id,
            $user->id,
            ['reason' => $validated['reason'] ?? null],
            ['certificateId' => $cert->id, 'verificationCode' => $cert->verification_code],
            $request,
        );

        return ApiResponse::success($request, $cert->fresh()->load(['course', 'student']));
    }

    /**
     * Public verification endpoint without authentication.
     * Exposes only necessary public information, honoring public_certificate_show_grade setting.
     */
    public function publicVerify(Request $request, string $code): JsonResponse
    {
        $cert = Certificate::query()
            ->with([
                'course:id,title,title_ar,instructor_id',
                'course.instructor:id,name,name_ar',
                'student:id,name',
                'organization:id,name,logo_path,settings',
            ])
            ->where('verification_code', strtoupper(trim($code)))
            ->first();

        if (! $cert) {
            return response()->json([
                'valid' => false,
                'status' => 'not_found',
                'message' => 'الشهادة غير موجودة أو غير مسجلة في النظام.',
            ], 404);
        }

        // Handle Revoked Certificates
        if ($cert->status === 'revoked') {
            $showRevocationReason = (bool) ($cert->organization?->settings['public_certificate_show_revocation_reason'] ?? true);
            $reason = $showRevocationReason ? ($cert->metadata['revocation_reason'] ?? null) : null;

            return response()->json([
                'valid' => false,
                'status' => 'revoked',
                'message' => 'هذه الشهادة تم إلغاؤها / Certificate Revoked.',
                'certificate' => [
                    'verificationCode' => $cert->verification_code,
                    'status' => 'revoked',
                    'studentName' => $cert->student?->name,
                    'courseTitle' => $cert->course?->title_ar ?: $cert->course?->title,
                    'organizationName' => $cert->organization?->name,
                    'revokedAt' => $cert->metadata['revoked_at'] ?? null,
                    'revocationReason' => $reason,
                ],
            ], 200);
        }

        // Privacy controls: Grade is NOT public by default unless explicitly allowed by academy setting
        $showGrade = (bool) ($cert->organization?->settings['public_certificate_show_grade'] ?? false);

        $payload = [
            'valid' => true,
            'status' => $cert->status,
            'certificate' => [
                'verificationCode' => $cert->verification_code,
                'studentName' => $cert->student?->name,
                'courseTitle' => $cert->course?->title_ar ?: $cert->course?->title,
                'organizationName' => $cert->organization?->name,
                'organizationLogo' => $cert->organization?->logo_path,
                'issueDate' => $cert->issue_date->toDateString(),
                'completionDate' => $cert->metadata['completionDate'] ?? $cert->issue_date->toDateString(),
                'instructor' => $cert->course?->instructor?->name_ar ?: $cert->course?->instructor?->name,
                'status' => $cert->status,
            ],
        ];

        if ($showGrade) {
            $payload['certificate']['gradeScore'] = $cert->grade_score;
        }

        $isTest = (bool) ($cert->metadata['is_test'] ?? false)
            || (bool) ($cert->metadata['is_qa_drill'] ?? false)
            || ($cert->organization?->is_test ?? false);

        if ($isTest) {
            $payload['isTestCredential'] = true;
            $payload['classification'] = 'QA_TEST_CREDENTIAL';
            $payload['certificate']['isTestCredential'] = true;
            $payload['certificate']['classification'] = 'QA_TEST_CREDENTIAL';
            $payload['message'] = 'هذه الشهادة صدرت كجزء من تدريب تقني واختبار للجودة وليست اعتماداً أكاديمياً نهائياً / This certificate is a QA/Test artifact and not an official production credential.';
        }

        return response()->json($payload);
    }

    private function organization(Request $request): Organization
    {
        $org = $request->attributes->get('active_organization');
        if (! $org && $request->route('organization')) {
            $orgParam = $request->route('organization');
            $org = $orgParam instanceof Organization ? $orgParam : Organization::query()->where('id', $orgParam)->orWhere('slug', $orgParam)->first();
        }
        if (! $org && $request->header('X-Organization-Id')) {
            $org = Organization::query()->find($request->header('X-Organization-Id'));
        }
        if (! $org) {
            throw new ApiException('UNAUTHORIZED', 'Organization context required.', 403);
        }

        // Verify caller membership in the resolved organization (unless platform super_admin)
        $user = $request->user();
        if ($user && ! $user->hasRole('super_admin')) {
            $hasMembership = $user->organizationMemberships()
                ->where('organization_id', $org->id)
                ->where('status', 'active')
                ->exists();

            if (! $hasMembership) {
                throw new ApiException('TENANT_ACCESS_DENIED', 'You do not have access to this organization.', 403);
            }
        }

        return $org;
    }
}
