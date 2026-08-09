<?php

namespace Tests\Feature;

use App\Domain\Identity\Enums\PlatformRole;
use App\Domain\Tenancy\Enums\OrganizationRole;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\OrganizationSubscription;
use App\Models\Plan;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RoleAccessMatrixTest extends TestCase
{
    use RefreshDatabase;

    public function test_platform_company_and_member_permissions_are_isolated(): void
    {
        $this->seed();
        $organization = Organization::query()->create([
            'name' => 'TechCorp Egypt',
            'slug' => 'techcorp-egypt',
            'type' => 'company',
            'status' => 'active',
        ]);
        $this->subscribe($organization);

        $superAdmin = User::factory()->create();
        $superAdmin->forceFill([
            'platform_role' => PlatformRole::SuperAdmin->value,
        ])->save();
        $companyAdmin = $this->member(
            $organization,
            OrganizationRole::Admin,
        );
        $member = $this->member($organization, OrganizationRole::Member);
        $outsideUser = User::factory()->create();

        Sanctum::actingAs($superAdmin);
        $this->getJson('/api/v1/admin/organizations')
            ->assertOk();

        Sanctum::actingAs($companyAdmin);
        $this->getJson('/api/v1/admin/organizations')
            ->assertForbidden()
            ->assertJsonPath('error.code', 'PLATFORM_ACCESS_DENIED');
        $this->getJson("/api/v1/organizations/{$organization->id}/members")
            ->assertOk();

        Sanctum::actingAs($member);
        $this->getJson("/api/v1/organizations/{$organization->id}/members")
            ->assertForbidden()
            ->assertJsonPath('error.code', 'FORBIDDEN');
        $this->getJson("/api/v1/organizations/{$organization->id}/rooms")
            ->assertOk();
        $this->postJson("/api/v1/organizations/{$organization->id}/rooms", [
            'name' => 'Management Room',
        ])
            ->assertForbidden()
            ->assertJsonPath('error.code', 'FORBIDDEN');

        Sanctum::actingAs($outsideUser);
        $this->getJson("/api/v1/organizations/{$organization->id}/rooms")
            ->assertForbidden()
            ->assertJsonPath('error.code', 'TENANT_ACCESS_DENIED');
    }

    private function member(
        Organization $organization,
        OrganizationRole $roleName,
    ): User {
        $user = User::factory()->create();
        $role = Role::query()
            ->whereNull('organization_id')
            ->where('name', $roleName->value)
            ->firstOrFail();

        OrganizationMembership::query()->create([
            'organization_id' => $organization->id,
            'user_id' => $user->id,
            'role_id' => $role->id,
            'status' => 'active',
            'joined_at' => now(),
        ]);

        return $user;
    }

    private function subscribe(Organization $organization): void
    {
        $plan = Plan::query()->where('code', 'growth')->firstOrFail();

        OrganizationSubscription::query()->create([
            'organization_id' => $organization->id,
            'plan_id' => $plan->id,
            'status' => 'trial',
            'billing_interval' => 'monthly',
            'trial_ends_at' => now()->addDays(14),
            'current_period_starts_at' => now(),
            'current_period_ends_at' => now()->addDays(14),
        ]);
    }
}
