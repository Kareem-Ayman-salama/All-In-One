<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Marketplace\Enums\CourseStatus;
use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ModerationRequest;
use App\Models\AcademyProfile;
use App\Models\Course;
use App\Models\Organization;
use App\Models\Promotion;
use App\Services\Operations\OperationRecorder;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminModerationController extends Controller
{
    public function organizations(Request $request): JsonResponse
    {
        $items = Organization::query()
            ->withCount('memberships', 'rooms', 'courses')
            ->with(['subscriptions' => fn ($query) => $query
                ->with('plan')
                ->latest('current_period_ends_at')])
            ->when(
                $request->filled('status'),
                fn ($query) => $query->where('status', $request->string('status')),
            )
            ->latest()
            ->paginate(min($request->integer('perPage', 30), 100));

        return ApiResponse::success($request, $items->items(), [
            'currentPage' => $items->currentPage(),
            'lastPage' => $items->lastPage(),
            'total' => $items->total(),
        ]);
    }

    public function academies(Request $request): JsonResponse
    {
        $items = AcademyProfile::query()
            ->with('organization')
            ->when(
                $request->filled('status'),
                fn ($query) => $query->where(
                    'verification_status',
                    $request->string('status'),
                ),
            )
            ->latest()
            ->paginate(min($request->integer('perPage', 30), 100));

        return ApiResponse::success($request, $items->items(), [
            'currentPage' => $items->currentPage(),
            'lastPage' => $items->lastPage(),
            'total' => $items->total(),
        ]);
    }

    public function verifyAcademy(
        ModerationRequest $request,
        string $academy,
        OperationRecorder $recorder,
    ): JsonResponse {
        $profile = AcademyProfile::query()->findOrFail($academy);
        $profile->update([
            'verification_status' => 'verified',
            'verified_at' => now(),
        ]);
        $recorder->record(
            'academy.verified',
            'academy_profile',
            $profile->id,
            $profile->organization_id,
            $request->user()->id,
            ['note' => $request->validated('note')],
            ['academyProfileId' => $profile->id],
            $request,
        );

        return ApiResponse::success($request, $profile->fresh());
    }

    public function rejectAcademy(
        ModerationRequest $request,
        string $academy,
        OperationRecorder $recorder,
    ): JsonResponse {
        if (! $request->filled('note')) {
            throw new ApiException(
                'MODERATION_NOTE_REQUIRED',
                'A rejection reason is required.',
                422,
            );
        }
        $profile = AcademyProfile::query()->findOrFail($academy);
        $profile->update([
            'verification_status' => 'rejected',
            'verified_at' => null,
            'is_public' => false,
        ]);
        $recorder->record(
            'academy.rejected',
            'academy_profile',
            $profile->id,
            $profile->organization_id,
            $request->user()->id,
            ['note' => $request->validated('note')],
            ['academyProfileId' => $profile->id],
            $request,
        );

        return ApiResponse::success($request, $profile->fresh());
    }

    public function courses(Request $request): JsonResponse
    {
        $items = Course::query()
            ->with('organization', 'academyProfile', 'instructor', 'category')
            ->when(
                $request->filled('status'),
                fn ($query) => $query->where('status', $request->string('status')),
                fn ($query) => $query->where(
                    'status',
                    CourseStatus::PendingReview,
                ),
            )
            ->latest()
            ->paginate(min($request->integer('perPage', 30), 100));

        return ApiResponse::success($request, $items->items(), [
            'currentPage' => $items->currentPage(),
            'lastPage' => $items->lastPage(),
            'total' => $items->total(),
        ]);
    }

    public function approveCourse(
        ModerationRequest $request,
        string $course,
        OperationRecorder $recorder,
    ): JsonResponse {
        $model = Course::query()->findOrFail($course);
        if ($model->status !== CourseStatus::PendingReview) {
            throw new ApiException(
                'COURSE_INVALID_STATE',
                'Only pending courses can be approved.',
                409,
            );
        }
        $model->update([
            'status' => CourseStatus::Published,
            'moderation_note' => $request->validated('note'),
            'moderated_by' => $request->user()->id,
            'published_at' => now(),
        ]);
        $recorder->record(
            'course.approved',
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

    public function rejectCourse(
        ModerationRequest $request,
        string $course,
        OperationRecorder $recorder,
    ): JsonResponse {
        if (! $request->filled('note')) {
            throw new ApiException(
                'MODERATION_NOTE_REQUIRED',
                'A rejection reason is required.',
                422,
            );
        }
        $model = Course::query()->findOrFail($course);
        if ($model->status !== CourseStatus::PendingReview) {
            throw new ApiException(
                'COURSE_INVALID_STATE',
                'Only pending courses can be rejected.',
                409,
            );
        }
        $model->update([
            'status' => CourseStatus::Rejected,
            'moderation_note' => $request->validated('note'),
            'moderated_by' => $request->user()->id,
            'published_at' => null,
        ]);
        $recorder->record(
            'course.rejected',
            'course',
            $model->id,
            $model->organization_id,
            $request->user()->id,
            ['note' => $request->validated('note')],
            ['courseId' => $model->id],
            $request,
        );

        return ApiResponse::success($request, $model->fresh());
    }

    public function promotions(Request $request): JsonResponse
    {
        $items = Promotion::query()
            ->with('organization', 'course')
            ->when(
                $request->filled('status'),
                fn ($query) => $query->where('status', $request->string('status')),
                fn ($query) => $query->where('status', 'pending_approval'),
            )
            ->latest()
            ->paginate(min($request->integer('perPage', 30), 100));

        return ApiResponse::success($request, $items->items(), [
            'currentPage' => $items->currentPage(),
            'lastPage' => $items->lastPage(),
            'total' => $items->total(),
        ]);
    }

    public function approvePromotion(
        ModerationRequest $request,
        string $promotion,
        OperationRecorder $recorder,
    ): JsonResponse {
        $model = Promotion::query()->findOrFail($promotion);
        if ($model->status !== 'pending_approval') {
            throw new ApiException(
                'PROMOTION_INVALID_STATE',
                'Only pending promotions can be approved.',
                409,
            );
        }
        $model->update([
            'status' => $model->start_date->lte(today()) ? 'active' : 'approved',
            'moderation_note' => $request->validated('note'),
            'moderated_by' => $request->user()->id,
        ]);
        $recorder->record(
            'promotion.approved',
            'promotion',
            $model->id,
            $model->organization_id,
            $request->user()->id,
            [],
            ['promotionId' => $model->id],
            $request,
        );

        return ApiResponse::success($request, $model->fresh());
    }

    public function rejectPromotion(
        ModerationRequest $request,
        string $promotion,
        OperationRecorder $recorder,
    ): JsonResponse {
        if (! $request->filled('note')) {
            throw new ApiException(
                'MODERATION_NOTE_REQUIRED',
                'A rejection reason is required.',
                422,
            );
        }
        $model = Promotion::query()->findOrFail($promotion);
        $model->update([
            'status' => 'rejected',
            'moderation_note' => $request->validated('note'),
            'moderated_by' => $request->user()->id,
        ]);
        $recorder->record(
            'promotion.rejected',
            'promotion',
            $model->id,
            $model->organization_id,
            $request->user()->id,
            ['note' => $request->validated('note')],
            ['promotionId' => $model->id],
            $request,
        );

        return ApiResponse::success($request, $model->fresh());
    }
}
