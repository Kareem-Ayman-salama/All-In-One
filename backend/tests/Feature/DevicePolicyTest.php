<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\Role;
use App\Models\User;
use App\Models\UserDevice;
use App\Models\UserSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class DevicePolicyTest extends TestCase
{
    use RefreshDatabase;

    public function test_device_policy_is_available_for_mobile_clients(): void
    {
        $this->getJson('/api/v1/meta/device-policy')
            ->assertOk()
            ->assertJsonPath('data.installation_id.source', 'application_generated')
            ->assertJsonPath('data.allow_same_installation_replacement', true)
            ->assertJsonPath('data.session_revocation.revokes_push_tokens_for_session', true)
            ->assertJsonStructure([
                'data' => [
                    'version',
                    'max_active_sessions_per_user',
                    'allowed_platforms',
                    'disallowed_practices',
                    'session_revocation',
                ],
                'requestId',
            ]);
    }

    public function test_login_rejects_new_device_when_session_limit_is_reached(): void
    {
        config(['device_policy.max_active_sessions_per_user' => 1]);
        $user = User::factory()->create([
            'email' => 'limited@example.com',
            'password' => Hash::make('SecurePass123'),
        ]);
        UserSession::query()->create([
            'user_id' => $user->id,
            'name' => 'Existing phone',
            'installation_id' => 'existing-installation',
            'platform' => 'ios',
            'refresh_token_hash' => hash('sha256', 'existing-refresh-token'),
            'expires_at' => now()->addDay(),
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'limited@example.com',
            'password' => 'SecurePass123',
            'deviceName' => 'Second phone',
            'installationId' => 'second-installation',
            'platform' => 'android',
        ])
            ->assertForbidden()
            ->assertJsonPath('error.code', 'DEVICE_LIMIT_REACHED');

        $this->assertSame(1, UserSession::query()->whereNull('revoked_at')->count());
    }

    public function test_same_installation_replaces_previous_session(): void
    {
        config(['device_policy.max_active_sessions_per_user' => 1]);
        $user = User::factory()->create([
            'email' => 'replace@example.com',
            'password' => Hash::make('SecurePass123'),
        ]);
        UserSession::query()->create([
            'user_id' => $user->id,
            'name' => 'Existing phone',
            'installation_id' => 'same-installation',
            'platform' => 'ios',
            'refresh_token_hash' => hash('sha256', 'old-refresh-token'),
            'expires_at' => now()->addDay(),
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'replace@example.com',
            'password' => 'SecurePass123',
            'deviceName' => 'Same phone',
            'installationId' => 'same-installation',
            'platform' => 'ios',
            'appVersion' => '1.2.3',
        ])
            ->assertOk()
            ->assertJsonStructure(['data' => ['accessToken']]);

        $this->assertSame(1, UserSession::query()->whereNull('revoked_at')->count());
        $this->assertDatabaseHas('user_sessions', [
            'user_id' => $user->id,
            'installation_id' => 'same-installation',
            'platform' => 'ios',
            'app_version' => '1.2.3',
            'revoked_at' => null,
        ]);
    }

    public function test_organization_device_approval_flow_blocks_new_devices(): void
    {
        $this->seed();
        [$organization, $admin, $student] = $this->organizationWithStudent();

        $this->postJson('/api/v1/auth/login', [
            'email' => $student->email,
            'password' => 'password',
            'deviceName' => 'Primary laptop',
            'installationId' => 'primary-installation',
            'platform' => 'web',
        ])
            ->assertOk();

        $this->assertDatabaseHas('user_devices', [
            'organization_id' => $organization->id,
            'user_id' => $student->id,
            'status' => 'approved',
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => $student->email,
            'password' => 'password',
            'deviceName' => 'Second phone',
            'installationId' => 'second-installation',
            'platform' => 'android',
        ])
            ->assertForbidden()
            ->assertJsonPath('error.code', 'DEVICE_APPROVAL_REQUIRED');

        $pending = UserDevice::query()
            ->where('user_id', $student->id)
            ->where('status', 'pending')
            ->firstOrFail();
        $adminToken = $admin->createToken('admin')->plainTextToken;

        $this->withToken($adminToken)
            ->getJson("/api/v1/organizations/{$organization->id}/member-devices?memberId={$student->id}")
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $this->withToken($adminToken)
            ->postJson("/api/v1/organizations/{$organization->id}/members/{$student->id}/devices/{$pending->id}/approve")
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');

        $this->postJson('/api/v1/auth/login', [
            'email' => $student->email,
            'password' => 'password',
            'deviceName' => 'Second phone',
            'installationId' => 'second-installation',
            'platform' => 'android',
        ])
            ->assertOk();

        $this->assertDatabaseHas('audit_logs', [
            'organization_id' => $organization->id,
            'actor_id' => $admin->id,
            'action' => 'device.approved',
            'entity_id' => $pending->id,
        ]);
    }

    public function test_blocking_member_device_revokes_linked_sessions(): void
    {
        $this->seed();
        [$organization, $admin, $student] = $this->organizationWithStudent();
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => $student->email,
            'password' => 'password',
            'deviceName' => 'Primary laptop',
            'installationId' => 'primary-installation',
            'platform' => 'web',
        ])->assertOk();

        $device = UserDevice::query()->where('user_id', $student->id)->firstOrFail();
        $session = UserSession::query()->where('user_id', $student->id)->firstOrFail();
        $adminToken = $admin->createToken('admin')->plainTextToken;

        $this->withToken($adminToken)
            ->postJson("/api/v1/organizations/{$organization->id}/members/{$student->id}/devices/{$device->id}/block")
            ->assertOk()
            ->assertJsonPath('data.status', 'blocked');

        $this->assertNotNull($session->fresh()->revoked_at);
        $this->assertDatabaseMissing('personal_access_tokens', [
            'token' => hash('sha256', explode('|', $response->json('data.accessToken'))[1]),
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'organization_id' => $organization->id,
            'actor_id' => $admin->id,
            'action' => 'device.blocked',
            'entity_id' => $device->id,
        ]);
    }

    /**
     * @return array{Organization, User, User}
     */
    private function organizationWithStudent(): array
    {
        $admin = User::factory()->create();
        $student = User::factory()->create();
        $organization = Organization::query()->create([
            'name' => 'Device Academy',
            'slug' => fake()->unique()->slug(),
            'type' => 'academy',
        ]);
        $ownerRole = Role::query()
            ->whereNull('organization_id')
            ->where('name', 'organization_owner')
            ->firstOrFail();
        $studentRole = Role::query()
            ->whereNull('organization_id')
            ->where('name', 'student')
            ->firstOrFail();

        OrganizationMembership::query()->create([
            'organization_id' => $organization->id,
            'user_id' => $admin->id,
            'role_id' => $ownerRole->id,
            'status' => 'active',
            'joined_at' => now(),
        ]);
        OrganizationMembership::query()->create([
            'organization_id' => $organization->id,
            'user_id' => $student->id,
            'role_id' => $studentRole->id,
            'status' => 'active',
            'joined_at' => now(),
        ]);

        return [$organization, $admin, $student];
    }
}
