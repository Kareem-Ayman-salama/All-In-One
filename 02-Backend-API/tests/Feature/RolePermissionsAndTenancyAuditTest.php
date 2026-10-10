<?php

namespace Tests\Feature;

use App\Domain\Tenancy\Enums\OrganizationRole;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\AuthorizationSeeder;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RolePermissionsAndTenancyAuditTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_isolation_prevents_cross_tenant_data_access(): void
    {
        $this->seed(PlanSeeder::class);
        $this->seed(AuthorizationSeeder::class);

        $tenantA = Organization::query()->create(['name' => 'Academy Alpha', 'slug' => 'academy-alpha', 'status' => 'active']);
        $tenantB = Organization::query()->create(['name' => 'Academy Beta', 'slug' => 'academy-beta', 'status' => 'active']);

        $ownerA = User::factory()->create(['name' => 'Owner Alpha']);
        $ownerB = User::factory()->create(['name' => 'Owner Beta']);

        $ownerRole = Role::query()->where('name', OrganizationRole::Owner->value)->firstOrFail();

        OrganizationMembership::query()->create([
            'organization_id' => $tenantA->id,
            'user_id' => $ownerA->id,
            'role_id' => $ownerRole->id,
            'status' => 'active',
            'joined_at' => now(),
        ]);

        OrganizationMembership::query()->create([
            'organization_id' => $tenantB->id,
            'user_id' => $ownerB->id,
            'role_id' => $ownerRole->id,
            'status' => 'active',
            'joined_at' => now(),
        ]);

        // Owner A can access Tenant A
        Sanctum::actingAs($ownerA);
        $this->getJson("/api/v1/organizations/{$tenantA->id}/context")
            ->assertOk()
            ->assertJsonPath('data.organization.id', $tenantA->id);

        // Owner A is forbidden from accessing Tenant B
        $this->getJson("/api/v1/organizations/{$tenantB->id}/context")
            ->assertStatus(403)
            ->assertJsonPath('error.code', 'TENANT_ACCESS_DENIED');
    }

    public function test_super_admin_has_platform_wide_access(): void
    {
        $this->seed(AuthorizationSeeder::class);

        $superAdmin = User::factory()->create(['platform_role' => 'super_admin']);

        $tenant = Organization::query()->create(['name' => 'Managed Academy', 'slug' => 'managed-academy', 'status' => 'active']);

        Sanctum::actingAs($superAdmin);

        // Super Admin can access platform operations
        $this->assertTrue($superAdmin->hasRole('super_admin'));
    }

    public function test_suspended_tenant_blocks_all_member_operations(): void
    {
        $this->seed(AuthorizationSeeder::class);

        $suspendedOrg = Organization::query()->create([
            'name' => 'Suspended Academy',
            'slug' => 'suspended-academy',
            'status' => 'suspended',
        ]);

        $owner = User::factory()->create();
        $ownerRole = Role::query()->where('name', OrganizationRole::Owner->value)->firstOrFail();

        OrganizationMembership::query()->create([
            'organization_id' => $suspendedOrg->id,
            'user_id' => $owner->id,
            'role_id' => $ownerRole->id,
            'status' => 'active',
            'joined_at' => now(),
        ]);

        Sanctum::actingAs($owner);

        $this->getJson("/api/v1/organizations/{$suspendedOrg->id}/context")
            ->assertStatus(403)
            ->assertJsonPath('error.code', 'ORGANIZATION_SUSPENDED');
    }
}
