<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Models\PushDeviceToken;
use App\Models\UserDevice;
use App\Models\UserSession;
use App\Services\Operations\OperationRecorder;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MemberDeviceController extends Controller
{
    public function index(Request $request, string $organization): JsonResponse
    {
        $activeOrganization = $request->attributes->get('active_organization');
        $devices = UserDevice::query()
            ->with('user:id,name,email')
            ->where('organization_id', $activeOrganization->id)
            ->when(
                $request->filled('memberId'),
                fn ($query) => $query->where(
                    'user_id',
                    $request->string('memberId'),
                ),
            )
            ->when(
                $request->filled('status'),
                fn ($query) => $query->where('status', $request->string('status')),
            )
            ->latest('last_seen_at')
            ->get()
            ->map(fn (UserDevice $device): array => $this->present($device));

        return ApiResponse::success($request, $devices);
    }

    public function member(
        Request $request,
        string $organization,
        string $member,
    ): JsonResponse {
        $this->ensureMember($request, $member);

        $devices = UserDevice::query()
            ->with('user:id,name,email')
            ->where('organization_id', $request->attributes->get('active_organization')->id)
            ->where('user_id', $member)
            ->latest('last_seen_at')
            ->get()
            ->map(fn (UserDevice $device): array => $this->present($device));

        return ApiResponse::success($request, $devices);
    }

    public function approve(
        Request $request,
        string $organization,
        string $member,
        string $device,
        OperationRecorder $recorder,
    ): JsonResponse {
        $model = $this->device($request, $member, $device);
        $model->forceFill([
            'status' => 'approved',
            'approved_at' => now(),
            'revoked_at' => null,
        ])->save();
        $this->record($request, $recorder, 'device.approved', $model);

        return ApiResponse::success($request, $this->present($model->fresh('user')));
    }

    public function block(
        Request $request,
        string $organization,
        string $member,
        string $device,
        OperationRecorder $recorder,
    ): JsonResponse {
        $model = $this->device($request, $member, $device);
        DB::transaction(function () use ($model): void {
            $model->forceFill([
                'status' => 'blocked',
                'revoked_at' => now(),
            ])->save();
            $this->revokeDeviceSessions($model);
        });
        $this->record($request, $recorder, 'device.blocked', $model);

        return ApiResponse::success($request, $this->present($model->fresh('user')));
    }

    public function revoke(
        Request $request,
        string $organization,
        string $member,
        string $device,
        OperationRecorder $recorder,
    ): JsonResponse {
        $model = $this->device($request, $member, $device);
        DB::transaction(function () use ($model): void {
            $model->forceFill([
                'status' => 'revoked',
                'revoked_at' => now(),
            ])->save();
            $this->revokeDeviceSessions($model);
        });
        $this->record($request, $recorder, 'device.revoked', $model);

        return ApiResponse::success($request, $this->present($model->fresh('user')));
    }

    private function ensureMember(Request $request, string $member): void
    {
        $organization = $request->attributes->get('active_organization');
        $exists = $organization->memberships()
            ->where('user_id', $member)
            ->where('status', 'active')
            ->exists();

        if (! $exists) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Member not found.', 404);
        }
    }

    private function device(
        Request $request,
        string $member,
        string $device,
    ): UserDevice {
        $this->ensureMember($request, $member);
        $organization = $request->attributes->get('active_organization');
        $model = UserDevice::query()
            ->with('user:id,name,email')
            ->where('organization_id', $organization->id)
            ->where('user_id', $member)
            ->where('id', $device)
            ->first();

        if (! $model) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Device not found.', 404);
        }

        return $model;
    }

    private function revokeDeviceSessions(UserDevice $device): void
    {
        $sessionIds = UserSession::query()
            ->where('user_device_id', $device->id)
            ->whereNull('revoked_at')
            ->pluck('id');

        UserSession::query()
            ->whereIn('id', $sessionIds)
            ->update(['revoked_at' => now()]);
        PushDeviceToken::query()
            ->whereIn('user_session_id', $sessionIds)
            ->whereNull('revoked_at')
            ->update(['revoked_at' => now()]);
        UserSession::query()
            ->whereIn('id', $sessionIds)
            ->with('accessToken')
            ->get()
            ->each(fn (UserSession $session) => $session->accessToken?->delete());
    }

    private function record(
        Request $request,
        OperationRecorder $recorder,
        string $action,
        UserDevice $device,
    ): void {
        $recorder->record(
            $action,
            'user_device',
            $device->id,
            $device->organization_id,
            $request->user()->id,
            ['userId' => $device->user_id, 'status' => $device->status],
            ['deviceId' => $device->id],
            $request,
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function present(UserDevice $device): array
    {
        return [
            'id' => $device->id,
            'userId' => $device->user_id,
            'user' => $device->user ? [
                'id' => $device->user->id,
                'name' => $device->user->name,
                'email' => $device->user->email,
            ] : null,
            'deviceName' => $device->device_name,
            'browser' => $device->browser,
            'operatingSystem' => $device->operating_system,
            'platform' => $device->platform,
            'appVersion' => $device->app_version,
            'lastIp' => $device->last_ip,
            'status' => $device->status,
            'firstSeenAt' => $device->first_seen_at,
            'lastSeenAt' => $device->last_seen_at,
            'approvedAt' => $device->approved_at,
            'revokedAt' => $device->revoked_at,
        ];
    }
}
