<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\CourseEnrollment;
use App\Models\SupportRequest as SupportTicket;
use App\Models\UserDevice;
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

    public function devices(Request $request): JsonResponse
    {
        $devices = UserDevice::query()
            ->where('user_id', $request->user()->id)
            ->latest('last_seen_at')
            ->get()
            ->map(fn (UserDevice $device): array => [
                'id' => $device->id,
                'user_id' => $device->user_id,
                'userId' => $device->user_id,
                'device_name' => $device->device_name,
                'deviceName' => $device->device_name,
                'browser' => $device->browser,
                'operating_system' => $device->operating_system,
                'operatingSystem' => $device->operating_system,
                'platform' => $device->platform,
                'app_version' => $device->app_version,
                'appVersion' => $device->app_version,
                'last_ip' => $device->last_ip,
                'lastIp' => $device->last_ip,
                'status' => $device->status,
                'first_seen_at' => $device->first_seen_at,
                'firstSeenAt' => $device->first_seen_at,
                'last_seen_at' => $device->last_seen_at,
                'lastSeenAt' => $device->last_seen_at,
                'approved_at' => $device->approved_at,
                'approvedAt' => $device->approved_at,
                'revoked_at' => $device->revoked_at,
                'revokedAt' => $device->revoked_at,
            ]);

        return ApiResponse::success($request, $devices);
    }

    public function requestDeviceReset(Request $request): JsonResponse
    {
        $data = $request->validate([
            'reason' => ['required', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $user = $request->user();
        $orgId = $user->memberships()
            ->where('status', 'active')
            ->value('organization_id');

        $ticket = SupportTicket::query()->create([
            'organization_id' => $orgId,
            'user_id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'subject' => 'Device Reset Request: '.$data['reason'],
            'message' => "Student {$user->name} ({$user->email}) requested a device reset.\nReason: {$data['reason']}\nNotes: ".($data['notes'] ?? 'None'),
            'priority' => 'high',
            'status' => 'open',
        ]);

        return ApiResponse::success($request, [
            'ticketId' => $ticket->id,
            'status' => 'pending',
            'message' => 'Device reset request submitted successfully.',
        ], status: 201);
    }
}
