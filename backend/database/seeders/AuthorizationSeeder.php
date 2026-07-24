<?php

namespace Database\Seeders;

use App\Domain\Authorization\Enums\PermissionName;
use App\Domain\Tenancy\Enums\OrganizationRole;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class AuthorizationSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = collect(PermissionName::cases())
            ->mapWithKeys(function (PermissionName $permission): array {
                $model = Permission::query()->firstOrCreate([
                    'name' => $permission->value,
                ]);

                return [$permission->value => $model->id];
            });

        $rolePermissions = [
            OrganizationRole::Owner->value => PermissionName::cases(),
            OrganizationRole::Admin->value => array_filter(
                PermissionName::cases(),
                fn (PermissionName $permission): bool => ! str_starts_with(
                    $permission->value,
                    'platform.',
                ) && ! in_array($permission, [
                    PermissionName::OrganizationManageBilling,
                    PermissionName::RolesManage,
                ], true),
            ),
            OrganizationRole::Instructor->value => $this->permissions([
                'organization.view',
                'members.view',
                'rooms.view',
                'content.view',
                'content.create',
                'content.update',
                'announcements.view',
                'announcements.create',
                'events.view',
                'events.manage',
                'courses.view',
                'courses.create',
                'courses.update',
                'batches.view',
                'batches.manage',
                'bookings.view',
                'enrollments.view',
            ]),
            OrganizationRole::Staff->value => $this->permissions([
                'organization.view',
                'members.view',
                'members.invite',
                'rooms.view',
                'content.view',
                'content.create',
                'announcements.view',
                'announcements.create',
                'events.view',
                'events.manage',
                'courses.view',
                'batches.view',
                'bookings.view',
                'bookings.manage',
                'subscriptions.view',
                'analytics.view',
            ]),
            OrganizationRole::Student->value => $this->permissions([
                'organization.view',
                'rooms.view',
                'content.view',
                'announcements.view',
                'events.view',
                'courses.view',
                'batches.view',
                'enrollments.view',
                'subscriptions.view',
            ]),
            OrganizationRole::Member->value => $this->permissions([
                'organization.view',
                'rooms.view',
                'content.view',
                'announcements.view',
                'events.view',
            ]),
        ];

        foreach ($rolePermissions as $name => $assignedPermissions) {
            $role = Role::query()->firstOrCreate([
                'organization_id' => null,
                'name' => $name,
                'scope' => 'organization',
            ], [
                'is_system' => true,
            ]);

            $permissionIds = collect($assignedPermissions)
                ->reject(fn (PermissionName $permission): bool => str_starts_with(
                    $permission->value,
                    'platform.',
                ))
                ->map(fn (PermissionName $permission): string => $permissions[$permission->value])
                ->values();

            $role->permissions()->sync($permissionIds);
        }
    }

    /**
     * @param  list<string>  $names
     * @return list<PermissionName>
     */
    private function permissions(array $names): array
    {
        return array_values(array_filter(
            PermissionName::cases(),
            fn (PermissionName $permission): bool => in_array(
                $permission->value,
                $names,
                true,
            ),
        ));
    }
}
