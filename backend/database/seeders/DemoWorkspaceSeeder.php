<?php

namespace Database\Seeders;

use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\OrganizationSubscription;
use App\Models\Plan;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoWorkspaceSeeder extends Seeder
{
    /**
     * Seed deterministic accounts for non-production acceptance testing.
     */
    public function run(): void
    {
        $this->call([
            AuthorizationSeeder::class,
            PlanSeeder::class,
        ]);

        $techCorp = $this->organization(
            'TechCorp Egypt',
            'techcorp-egypt',
            'company',
        );
        $academy = $this->organization(
            'Elite Academy',
            'elite-academy',
            'academy',
        );

        $this->subscribe($techCorp, 'growth');
        $this->subscribe($academy, 'pro');

        $superAdmin = $this->user(
            'Platform Admin',
            'super@ain.test',
            platformRole: 'super_admin',
        );
        $companyAdmin = $this->user(
            'Ahmed Mostafa',
            'admin@techcorp.test',
        );
        $employee = $this->user(
            'Mohamed Ahmed',
            'employee@techcorp.test',
        );
        $student = $this->user(
            'Mariam Hassan',
            'student@ain.test',
        );

        $this->membership($techCorp, $companyAdmin, 'organization_admin');
        $this->membership($techCorp, $employee, 'member');
        $this->membership($academy, $student, 'student');

        $superAdmin->tokens()->delete();
    }

    private function organization(
        string $name,
        string $slug,
        string $type,
    ): Organization {
        return Organization::query()->updateOrCreate([
            'slug' => $slug,
        ], [
            'name' => $name,
            'type' => $type,
            'status' => 'active',
            'brand_color' => '#16458F',
            'locale' => 'ar',
            'timezone' => 'Africa/Cairo',
        ]);
    }

    private function subscribe(Organization $organization, string $planCode): void
    {
        $plan = Plan::query()->where('code', $planCode)->firstOrFail();

        OrganizationSubscription::query()->updateOrCreate([
            'organization_id' => $organization->id,
        ], [
            'plan_id' => $plan->id,
            'status' => 'active',
            'billing_interval' => 'monthly',
            'current_period_starts_at' => now(),
            'current_period_ends_at' => now()->addYear(),
        ]);
    }

    private function user(
        string $name,
        string $email,
        ?string $platformRole = null,
    ): User {
        $user = User::query()->withTrashed()->firstOrNew([
            'normalized_email' => mb_strtolower($email),
        ]);
        $user->forceFill([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make('12345678'),
            'platform_role' => $platformRole,
            'status' => 'active',
            'email_verified_at' => now(),
            'deleted_at' => null,
        ])->save();

        return $user;
    }

    private function membership(
        Organization $organization,
        User $user,
        string $roleName,
    ): void {
        $role = Role::query()
            ->whereNull('organization_id')
            ->where('scope', 'organization')
            ->where('name', $roleName)
            ->firstOrFail();

        OrganizationMembership::query()->updateOrCreate([
            'organization_id' => $organization->id,
            'user_id' => $user->id,
        ], [
            'role_id' => $role->id,
            'status' => 'active',
            'joined_at' => now(),
            'suspended_at' => null,
        ]);
    }
}
