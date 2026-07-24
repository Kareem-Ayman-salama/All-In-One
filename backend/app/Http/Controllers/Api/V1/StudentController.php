<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\CourseEnrollment;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    public function bookings(Request $request): JsonResponse
    {
        $items = Booking::query()
            ->with('course.academyProfile', 'batch', 'enrollment.subscription')
            ->where('student_id', $request->user()->id)
            ->latest()
            ->paginate(min($request->integer('perPage', 20), 100));

        return ApiResponse::success($request, $items->items(), [
            'currentPage' => $items->currentPage(),
            'lastPage' => $items->lastPage(),
            'total' => $items->total(),
        ]);
    }

    public function enrollments(Request $request): JsonResponse
    {
        $items = CourseEnrollment::query()
            ->with(
                'course.academyProfile',
                'course.instructor',
                'batch.room',
                'subscription',
            )
            ->where('student_id', $request->user()->id)
            ->latest()
            ->paginate(min($request->integer('perPage', 20), 100));

        return ApiResponse::success($request, $items->items(), [
            'currentPage' => $items->currentPage(),
            'lastPage' => $items->lastPage(),
            'total' => $items->total(),
        ]);
    }

    public function enrollment(
        Request $request,
        string $enrollment,
    ): JsonResponse {
        $model = CourseEnrollment::query()
            ->with([
                'course.academyProfile',
                'course.instructor',
                'batch.room',
                'subscription',
                'roomMembership',
            ])
            ->where('student_id', $request->user()->id)
            ->where('id', $enrollment)
            ->first();
        if (! $model) {
            throw new ApiException(
                'RESOURCE_NOT_FOUND',
                'Course enrollment not found.',
                404,
            );
        }
        $active = $model->status === 'active'
            && $model->access_starts_at->lte(now())
            && $model->access_ends_at->gte(now())
            && $model->subscription?->status === 'active'
            && $model->subscription?->ends_at?->gte(now());

        return ApiResponse::success($request, [
            'enrollment' => $model,
            'access' => [
                'allowed' => $active,
                'reason' => $active ? null : 'subscription_or_access_expired',
                'renewalRequired' => ! $active,
            ],
        ]);
    }
}
