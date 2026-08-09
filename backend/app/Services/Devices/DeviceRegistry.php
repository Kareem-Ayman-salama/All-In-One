<?php

namespace App\Services\Devices;

use App\Exceptions\ApiException;
use App\Models\OrganizationMembership;
use App\Models\User;
use App\Models\UserDevice;
use App\Services\Security\SecurityEventLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class DeviceRegistry
{
    public function __construct(
        private readonly SecurityEventLogger $securityEvents,
    ) {}

    /**
     * @param  array<string, mixed>|null  $device
     * @return Collection<int, UserDevice>
     */
    public function registerForActiveMemberships(
        User $user,
        Request $request,
        ?array $device,
    ): Collection {
        $installationId = $device['installationId'] ?? null;
        if (! $installationId) {
            return collect();
        }

        $memberships = OrganizationMembership::query()
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->get();

        return $memberships->map(function (OrganizationMembership $membership) use (
            $user,
            $request,
            $device,
            $installationId,
        ): UserDevice {
            return $this->register(
                $user,
                $membership->organization_id,
                $installationId,
                $request,
                $device,
            );
        });
    }

    /**
     * @param  array<string, mixed>|null  $device
     */
    private function register(
        User $user,
        string $organizationId,
        string $installationId,
        Request $request,
        ?array $device,
    ): UserDevice {
        $deviceHash = hash('sha256', $installationId);
        $existing = UserDevice::query()
            ->where('organization_id', $organizationId)
            ->where('user_id', $user->id)
            ->where('device_hash', $deviceHash)
            ->first();

        if ($existing?->status === 'blocked' || $existing?->revoked_at) {
            $this->securityEvents->record(
                'device_blocked',
                $organizationId,
                $user->id,
                'user_device',
                $existing->id,
                ['deviceName' => $existing->device_name],
                $request,
            );

            throw new ApiException(
                'DEVICE_BLOCKED',
                'This device is blocked for this workspace.',
                403,
            );
        }

        $status = $existing?->status ?? $this->initialStatus($user, $organizationId);
        if ($status === 'pending') {
            $this->touchDevice(
                $user,
                $organizationId,
                $deviceHash,
                $request,
                $device,
                $existing,
                'pending',
                null,
            );
            $pending = UserDevice::query()
                ->where('organization_id', $organizationId)
                ->where('user_id', $user->id)
                ->where('device_hash', $deviceHash)
                ->first();
            $this->securityEvents->record(
                'new_device_detected',
                $organizationId,
                $user->id,
                'user_device',
                $pending?->id,
                ['deviceName' => $device['deviceName'] ?? null],
                $request,
            );

            throw new ApiException(
                'DEVICE_APPROVAL_REQUIRED',
                'This device needs admin approval before it can be used.',
                403,
            );
        }

        return $this->touchDevice(
            $user,
            $organizationId,
            $deviceHash,
            $request,
            $device,
            $existing,
            $status,
            $existing?->approved_at ?? now(),
        );
    }

    /**
     * @param  array<string, mixed>|null  $device
     */
    private function touchDevice(
        User $user,
        string $organizationId,
        string $deviceHash,
        Request $request,
        ?array $device,
        ?UserDevice $existing,
        string $status,
        mixed $approvedAt,
    ): UserDevice {
        return UserDevice::query()->updateOrCreate([
            'organization_id' => $organizationId,
            'user_id' => $user->id,
            'device_hash' => $deviceHash,
        ], [
            'device_name' => $device['deviceName'] ?? null,
            'browser' => $this->browser($request),
            'operating_system' => $this->operatingSystem($request),
            'platform' => $device['platform'] ?? null,
            'app_version' => $device['appVersion'] ?? null,
            'first_seen_at' => $existing?->first_seen_at ?? now(),
            'last_seen_at' => now(),
            'last_ip' => $request->ip(),
            'status' => $status,
            'approved_at' => $approvedAt,
            'revoked_at' => null,
        ]);
    }

    private function initialStatus(User $user, string $organizationId): string
    {
        $approvedDevices = UserDevice::query()
            ->where('organization_id', $organizationId)
            ->where('user_id', $user->id)
            ->where('status', 'approved')
            ->whereNull('revoked_at')
            ->count();

        return $approvedDevices < (int) config('device_policy.max_approved_devices_per_member', 1)
            ? 'approved'
            : 'pending';
    }

    private function browser(Request $request): ?string
    {
        $agent = (string) $request->userAgent();

        return match (true) {
            str_contains($agent, 'Edg/') => 'Edge',
            str_contains($agent, 'Chrome/') => 'Chrome',
            str_contains($agent, 'Safari/') => 'Safari',
            str_contains($agent, 'Firefox/') => 'Firefox',
            $agent !== '' => 'Unknown',
            default => null,
        };
    }

    private function operatingSystem(Request $request): ?string
    {
        $agent = (string) $request->userAgent();

        return match (true) {
            str_contains($agent, 'Android') => 'Android',
            str_contains($agent, 'iPhone') || str_contains($agent, 'iPad') => 'iOS',
            str_contains($agent, 'Windows') => 'Windows',
            str_contains($agent, 'Mac OS') => 'macOS',
            str_contains($agent, 'Linux') => 'Linux',
            $agent !== '' => 'Unknown',
            default => null,
        };
    }
}
