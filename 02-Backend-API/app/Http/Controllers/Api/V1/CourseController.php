<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Marketplace\Enums\CourseStatus;
use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Courses\StoreCourseRequest;
use App\Models\Course;
use App\Models\Organization;
use App\Services\Marketplace\CoursePresenter;
use App\Services\Operations\OperationRecorder;
use App\Services\Plans\EntitlementService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CourseController extends Controller
{
    public function index(
        Request $request,
        CoursePresenter $presenter,
    ): JsonResponse {
        $items = Course::query()
            ->with('academyProfile', 'instructor', 'category', 'batches')
            ->where('organization_id', $this->organization($request)->id)
            ->when(
                $request->filled('status'),
                fn ($query) => $query->where('status', $request->string('status')),
            )
            ->when($request->filled('search'), function ($query) use ($request): void {
                $search = '%'.$request->string('search')->trim()->toString().'%';
                $query->where(fn ($nested) => $nested
                    ->where('title', 'like', $search)
                    ->orWhere('title_ar', 'like', $search));
            })
            ->latest()
            ->paginate(min($request->integer('perPage', 20), 100));

        return ApiResponse::success(
            $request,
            collect($items->items())->map(
                fn (Course $course): array => $presenter->present($course, true),
            ),
            [
                'currentPage' => $items->currentPage(),
                'lastPage' => $items->lastPage(),
                'total' => $items->total(),
            ],
        );
    }

    public function store(
        StoreCourseRequest $request,
        CoursePresenter $presenter,
        OperationRecorder $recorder,
        EntitlementService $entitlements,
    ): JsonResponse {
        $organization = $this->organization($request);
        $profile = $organization->academyProfile;
        if (! $profile) {
            throw new ApiException(
                'ACADEMY_PROFILE_REQUIRED',
                'Create the academy profile before creating courses.',
                409,
            );
        }

        $course = DB::transaction(function () use (
            $request,
            $organization,
            $profile,
            $recorder,
            $entitlements,
        ): Course {
            Organization::query()->whereKey($organization->id)->lockForUpdate()->firstOrFail();
            $entitlements->assertCurrentCount(
                $organization,
                'courses',
                Course::query()
                    ->where('organization_id', $organization->id)
                    ->count(),
            );
            $course = Course::query()->create(
                $this->attributes($request, $organization) + [
                    'academy_profile_id' => $profile->id,
                    'created_by' => $request->user()->id,
                    'slug' => $this->uniqueSlug(
                        $organization,
                        $request->validated('title'),
                    ),
                    'status' => CourseStatus::Draft,
                ],
            );
            $recorder->record(
                'course.created',
                'course',
                $course->id,
                $organization->id,
                $request->user()->id,
                ['status' => CourseStatus::Draft->value],
                ['courseId' => $course->id],
                $request,
            );

            return $course;
        }, attempts: 3);

        return ApiResponse::success(
            $request,
            $presenter->present($course, true),
            status: 201,
        );
    }

    public function show(
        Request $request,
        string $organization,
        string $course,
        CoursePresenter $presenter,
    ): JsonResponse {
        return ApiResponse::success(
            $request,
            $presenter->present($this->course($request, $course), true),
        );
    }

    public function update(
        StoreCourseRequest $request,
        string $organization,
        string $course,
        CoursePresenter $presenter,
        OperationRecorder $recorder,
    ): JsonResponse {
        $model = $this->course($request, $course);
        if (! in_array($model->status, [
            CourseStatus::Draft,
            CourseStatus::Rejected,
            CourseStatus::Unpublished,
        ], true)) {
            throw new ApiException(
                'COURSE_NOT_EDITABLE',
                'Only draft, rejected, or unpublished courses can be edited.',
                409,
            );
        }
        $model->update($this->attributes(
            $request,
            $this->organization($request),
        ) + [
            'status' => CourseStatus::Draft,
            'moderation_note' => null,
        ]);
        $recorder->record(
            'course.updated',
            'course',
            $model->id,
            $model->organization_id,
            $request->user()->id,
            [],
            ['courseId' => $model->id],
            $request,
        );

        return ApiResponse::success(
            $request,
            $presenter->present($model->fresh(), true),
        );
    }

    public function submitForReview(
        Request $request,
        string $organization,
        string $course,
        OperationRecorder $recorder,
    ): JsonResponse {
        $model = $this->course($request, $course);
        if (! in_array($model->status, [
            CourseStatus::Draft,
            CourseStatus::Rejected,
        ], true)) {
            throw new ApiException(
                'COURSE_INVALID_STATE',
                'This course cannot be submitted for review.',
                409,
            );
        }
        if (! $model->description || ! $model->instructor_id) {
            throw new ApiException(
                'COURSE_INCOMPLETE',
                'Add a description and instructor before submitting.',
                422,
            );
        }
        $model->update([
            'status' => CourseStatus::PendingReview,
            'moderation_note' => null,
        ]);
        $recorder->record(
            'course.submitted_for_review',
            'course',
            $model->id,
            $model->organization_id,
            $request->user()->id,
            [],
            ['courseId' => $model->id],
            $request,
        );

        return ApiResponse::success($request, $model->fresh());
    }

    /**
     * @return array<string, mixed>
     */
    private function attributes(
        StoreCourseRequest $request,
        Organization $organization,
    ): array {
        return [
            'organization_id' => $organization->id,
            'instructor_id' => $request->validated('instructorId'),
            'category_id' => $request->validated('categoryId'),
            'title' => $request->validated('title'),
            'title_ar' => $request->validated('titleAr'),
            'short_description' => $request->validated('shortDescription'),
            'short_description_ar' => $request->validated('shortDescriptionAr'),
            'description' => $request->validated('description'),
            'description_ar' => $request->validated('descriptionAr'),
            'education_level' => $request->validated('educationLevel'),
            'subject' => $request->validated('subject'),
            'delivery_type' => $request->validated('deliveryType'),
            'price_minor' => $request->validated('priceMinor'),
            'discounted_price_minor' => $request->validated('discountedPriceMinor'),
            'currency' => strtoupper($request->validated('currency', 'EGP')),
            'discount_ends_at' => $request->validated('discountEndsAt'),
            'learning_outcomes' => $request->validated('learningOutcomes', []),
            'requirements' => $request->validated('requirements', []),
            'duration' => $request->validated('duration'),
            'sessions_count' => $request->validated('sessionsCount'),
        ];
    }

    private function organization(Request $request): Organization
    {
        return $request->attributes->get('active_organization');
    }

    private function course(Request $request, string $identifier): Course
    {
        $model = Course::query()
            ->with('academyProfile', 'instructor', 'category', 'batches')
            ->where('organization_id', $this->organization($request)->id)
            ->where(fn ($query) => $query
                ->where('id', $identifier)
                ->orWhere('slug', $identifier))
            ->first();
        if (! $model) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Course not found.', 404);
        }

        return $model;
    }

    private function uniqueSlug(
        Organization $organization,
        string $title,
    ): string {
        $base = Str::slug($title) ?: 'course';
        $slug = $base;
        $suffix = 2;
        while (Course::withTrashed()
            ->where('organization_id', $organization->id)
            ->where('slug', $slug)
            ->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
