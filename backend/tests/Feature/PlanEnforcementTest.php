<?php

namespace Tests\Feature;

use App\Models\AcademyProfile;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\OrganizationSubscription;
use App\Models\Plan;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PlanEnforcementTest extends TestCase
{
    use RefreshDatabase;

    public function test_expired_active_subscription_does_not_enable_modules(): void
    {
        $this->seed();
        $user = User::factory()->create();
        $organization = Organization::query()->create([
            'name' => 'Expired Academy',
            'slug' => 'expired-academy',
            'type' => 'academy',
        ]);
        $role = Role::query()
            ->whereNull('organization_id')
            ->where('name', 'organization_owner')
            ->firstOrFail();
        OrganizationMembership::query()->create([
            'organization_id' => $organization->id,
            'user_id' => $user->id,
            'role_id' => $role->id,
            'status' => 'active',
            'joined_at' => now(),
        ]);
        OrganizationSubscription::query()->create([
            'organization_id' => $organization->id,
            'plan_id' => Plan::query()->where('code', 'growth')->firstOrFail()->id,
            'status' => 'active',
            'billing_interval' => 'monthly',
            'current_period_starts_at' => now()->subMonths(2),
            'current_period_ends_at' => now()->subMonth(),
        ]);

        Sanctum::actingAs($user);

        $this->getJson("/api/v1/organizations/{$organization->id}/courses")
            ->assertForbidden()
            ->assertJsonPath('error.code', 'MODULE_DISABLED')
            ->assertJsonPath('error.details.upgradeRequired', true);
        $this->getJson("/api/v1/organizations/{$organization->id}/rooms")
            ->assertForbidden()
            ->assertJsonPath('error.code', 'MODULE_DISABLED');
        $this->getJson("/api/v1/organizations/{$organization->id}/content")
            ->assertForbidden()
            ->assertJsonPath('error.code', 'MODULE_DISABLED');

        AcademyProfile::query()->create([
            'organization_id' => $organization->id,
            'slug' => 'expired-academy',
            'public_name' => 'Expired Academy',
            'description' => 'This profile must not remain public.',
            'is_public' => true,
            'verification_status' => 'verified',
            'verified_at' => now(),
        ]);

        $this->getJson('/api/v1/public/academies')
            ->assertOk()
            ->assertJsonPath('meta.total', 0);
    }

    public function test_unexpired_grace_period_still_enables_modules(): void
    {
        $this->seed();
        $user = User::factory()->create();
        $organization = Organization::query()->create([
            'name' => 'Grace Academy',
            'slug' => 'grace-academy',
            'type' => 'academy',
        ]);
        $role = Role::query()
            ->whereNull('organization_id')
            ->where('name', 'organization_owner')
            ->firstOrFail();
        OrganizationMembership::query()->create([
            'organization_id' => $organization->id,
            'user_id' => $user->id,
            'role_id' => $role->id,
            'status' => 'active',
            'joined_at' => now(),
        ]);
        OrganizationSubscription::query()->create([
            'organization_id' => $organization->id,
            'plan_id' => Plan::query()->where('code', 'growth')->firstOrFail()->id,
            'status' => 'grace',
            'billing_interval' => 'monthly',
            'current_period_starts_at' => now()->subMonth(),
            'current_period_ends_at' => now()->subDay(),
            'grace_ends_at' => now()->addDays(3),
        ]);

        Sanctum::actingAs($user);

        $this->getJson("/api/v1/organizations/{$organization->id}/courses")
            ->assertOk();

        AcademyProfile::query()->create([
            'organization_id' => $organization->id,
            'slug' => 'grace-academy',
            'public_name' => 'Grace Academy',
            'description' => 'This profile remains public during grace.',
            'is_public' => true,
            'verification_status' => 'verified',
            'verified_at' => now(),
        ]);

        $this->getJson('/api/v1/public/academies')
            ->assertOk()
            ->assertJsonPath('meta.total', 1);
    }
}
