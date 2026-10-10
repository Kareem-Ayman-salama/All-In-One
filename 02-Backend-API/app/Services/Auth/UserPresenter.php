<?php

namespace App\Services\Auth;

use App\Models\OrganizationMembership;
use App\Models\User;

class UserPresenter
{
    /**
     * @return array<string, mixed>
     */
    public function present(User $user): array
    {
        $user->loadMissing('memberships.organization', 'memberships.role.permissions');
        $activeMemberships = $user->memberships
            ->where('status', 'active')
            ->values();
        /** @var OrganizationMembership|null $primary */
        $primary = $activeMemberships->first();

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'avatar' => $user->avatar_path,
            'platformRole' => $user->platform_role,
            'role' => $this->legacyRole($user, $primary),
            'roleLabel' => $primary?->role?->name ?? $user->platform_role ?? 'member',
            'company' => $primary?->organization?->name ?? 'No workspace yet',
            'tenantId' => $primary?->organization_id,
            'workspaceStatus' => $primary ? 'active' : 'none',
            'permissions' => $primary?->role?->permissions
                ->pluck('name')
                ->values()
                ->all() ?? [],
            'emailVerified' => $user->email_verified_at !== null,
            'locale' => $user->locale,
            'timezone' => $user->timezone,
            'workspaces' => $activeMemberships->map(
                fn (OrganizationMembership $membership): array => [
                    'membershipId' => $membership->id,
                    'organizationId' => $membership->organization_id,
                    'name' => $membership->organization->name,
                    'slug' => $membership->organization->slug,
                    'type' => $membership->organization->type,
                    'role' => $membership->role->name,
                    'permissions' => $membership->role->permissions
                        ->pluck('name')
                        ->values()
                        ->all(),
                ],
            )->all(),
        ];
    }

    private function legacyRole(User $user, ?OrganizationMembership $membership): string
    {
        if ($user->platform_role === 'super_admin') {
            return 'super-admin';
        }

        if (in_array($membership?->role?->name, [
            'organization_owner',
            'organization_admin',
            'instructor',
            'staff',
        ], true)) {
            return 'tenant-admin';
        }

        return 'end-user';
    }
}
