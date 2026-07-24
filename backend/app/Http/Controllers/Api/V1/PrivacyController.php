<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Models\AccountDeletionRequest;
use App\Models\Booking;
use App\Models\CourseEnrollment;
use App\Models\Notification;
use App\Models\OrganizationMembership;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PrivacyController extends Controller
{
    public function export(Request $request): JsonResponse
    {
        $user = $request->user();

        return ApiResponse::success($request, [
            'generatedAt' => now(),
            'profile' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'locale' => $user->locale,
                'timezone' => $user->timezone,
                'createdAt' => $user->created_at,
            ],
            'memberships' => OrganizationMembership::query()
                ->with('organization:id,name,slug,type', 'role:id,name')
                ->where('user_id', $user->id)
                ->get(),
            'bookings' => Booking::query()
                ->where('student_id', $user->id)
                ->get(),
            'enrollments' => CourseEnrollment::query()
                ->where('student_id', $user->id)
                ->get(),
            'notifications' => Notification::query()
                ->where('user_id', $user->id)
                ->get(),
        ]);
    }

    public function requestDeletion(Request $request): JsonResponse
    {
        $existing = AccountDeletionRequest::query()
            ->where('user_id', $request->user()->id)
            ->where('status', 'pending')
            ->first();
        if ($existing) {
            return ApiResponse::success($request, $existing);
        }
        $deletion = AccountDeletionRequest::query()->create([
            'user_id' => $request->user()->id,
            'status' => 'pending',
            'reason' => $request->string('reason')->limit(2000)->toString() ?: null,
            'requested_at' => now(),
            'scheduled_for' => now()->addDays(30),
        ]);

        return ApiResponse::success($request, $deletion, status: 202);
    }

    public function cancelDeletion(Request $request): JsonResponse
    {
        $deletion = AccountDeletionRequest::query()
            ->where('user_id', $request->user()->id)
            ->where('status', 'pending')
            ->latest('requested_at')
            ->first();
        if (! $deletion) {
            throw new ApiException(
                'DELETION_REQUEST_NOT_FOUND',
                'No pending account deletion request was found.',
                404,
            );
        }
        $deletion->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);

        return ApiResponse::success($request, $deletion->fresh());
    }
}
