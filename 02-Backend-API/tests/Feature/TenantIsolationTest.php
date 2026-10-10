<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_cannot_resolve_an_unrelated_organization(): void
    {
        $this->seed();
        $user = User::factory()->create();
        $allowed = Organization::query()->create([
            'name' => 'Allowed Academy',
            'slug' => 'allowed-academy',
        ]);
        $blocked = Organization::query()->create([
            'name' => 'Blocked Academy',
            'slug' => 'blocked-academy',
        ]);
        $role = Role::query()
            ->where('name', 'organization_owner')
            ->whereNull('organization_id')
            ->firstOrFail();

        OrganizationMembership::query()->create([
            'organization_id' => $allowed->id,
            'user_id' => $user->id,
            'role_id' => $role->id,
            'status' => 'active',
            'joined_at' => now(),
        ]);

        Sanctum::actingAs($user);

        $this->getJson("/api/v1/organizations/{$allowed->id}/context")
            ->assertOk()
            ->assertJsonPath('data.organization.id', $allowed->id);

        $this->getJson("/api/v1/organizations/{$blocked->id}/context")
            ->assertForbidden()
            ->assertJsonPath('error.code', 'TENANT_ACCESS_DENIED');
    }

    public function test_member_cannot_access_a_suspended_organization(): void
    {
        $this->seed();
        $user = User::factory()->create();
        $organization = Organization::query()->create([
            'name' => 'Suspended Academy',
            'slug' => 'suspended-academy',
            'status' => 'suspended',
        ]);
        $role = Role::query()
            ->where('name', 'organization_owner')
            ->whereNull('organization_id')
            ->firstOrFail();

        OrganizationMembership::query()->create([
            'organization_id' => $organization->id,
            'user_id' => $user->id,
            'role_id' => $role->id,
            'status' => 'active',
            'joined_at' => now(),
        ]);

        Sanctum::actingAs($user);

        $this->getJson("/api/v1/organizations/{$organization->id}/context")
            ->assertForbidden()
            ->assertJsonPath('error.code', 'ORGANIZATION_SUSPENDED');
    }
}
