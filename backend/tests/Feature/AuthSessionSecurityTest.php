<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\User;
use App\Models\UserSession;
use App\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthSessionSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_refresh_rotation_revokes_the_previous_access_token(): void
    {
        $user = User::factory()->create();
        $oldAccessToken = $user->createToken('old-browser');
        $rawRefreshToken = bin2hex(random_bytes(48));
        $oldSession = $this->createSessionRecord(
            $user,
            $oldAccessToken->accessToken->id,
            $rawRefreshToken,
        );

        $response = $this->postJson('/api/v1/auth/refresh', [
            'refreshToken' => $rawRefreshToken,
        ])->assertOk();

        $this->assertDatabaseMissing('personal_access_tokens', [
            'id' => $oldAccessToken->accessToken->id,
        ]);
        $this->assertNotNull($oldSession->fresh()->revoked_at);
        $this->assertDatabaseHas('user_sessions', [
            'user_id' => $user->id,
            'revoked_at' => null,
        ]);
        $this->assertNotNull(
            UserSession::query()
                ->where('user_id', $user->id)
                ->whereNull('revoked_at')
                ->value('access_token_id'),
        );

        $this->withToken($oldAccessToken->plainTextToken)
            ->getJson('/api/v1/auth/me')
            ->assertUnauthorized();
        $this->withToken($response->json('data.accessToken'))
            ->getJson('/api/v1/auth/me')
            ->assertOk();
    }

    public function test_revoking_other_sessions_preserves_current_and_other_users(): void
    {
        $user = User::factory()->create();
        $current = $user->createToken('current');
        $other = $user->createToken('other');
        $currentSession = $this->createSessionRecord(
            $user,
            $current->accessToken->id,
            bin2hex(random_bytes(48)),
        );
        $otherSession = $this->createSessionRecord(
            $user,
            $other->accessToken->id,
            bin2hex(random_bytes(48)),
        );

        $unrelatedUser = User::factory()->create();
        $unrelatedSession = $this->createSessionRecord(
            $unrelatedUser,
            null,
            bin2hex(random_bytes(48)),
        );

        $this->withToken($current->plainTextToken)
            ->deleteJson('/api/v1/auth/sessions/others')
            ->assertOk();

        $this->assertNull($currentSession->fresh()->revoked_at);
        $this->assertNotNull($otherSession->fresh()->revoked_at);
        $this->assertNull($unrelatedSession->fresh()->revoked_at);
        $this->assertDatabaseHas('personal_access_tokens', [
            'id' => $current->accessToken->id,
        ]);
        $this->assertDatabaseMissing('personal_access_tokens', [
            'id' => $other->accessToken->id,
        ]);
    }

    public function test_password_change_revokes_every_session_and_access_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('browser');
        $this->createSessionRecord(
            $user,
            $token->accessToken->id,
            bin2hex(random_bytes(48)),
        );

        $this->withToken($token->plainTextToken)
            ->postJson('/api/v1/auth/change-password', [
                'currentPassword' => 'password',
                'newPassword' => 'NewSecurePass123',
                'newPassword_confirmation' => 'NewSecurePass123',
            ])
            ->assertOk()
            ->assertJsonPath('data.reauthenticationRequired', true);

        $this->assertDatabaseCount('personal_access_tokens', 0);
        $this->assertDatabaseMissing('user_sessions', [
            'user_id' => $user->id,
            'revoked_at' => null,
        ]);
        $this->app['auth']->forgetGuards();
        $this->withToken($token->plainTextToken)
            ->getJson('/api/v1/auth/me')
            ->assertUnauthorized();
    }

    public function test_organization_admin_can_list_and_revoke_member_sessions(): void
    {
        $this->seed();
        $admin = User::factory()->create();
        $member = User::factory()->create();
        $organization = Organization::query()->create([
            'name' => 'Session Academy',
            'slug' => 'session-academy',
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
            'user_id' => $member->id,
            'role_id' => $studentRole->id,
            'status' => 'active',
            'joined_at' => now(),
        ]);

        $adminToken = $admin->createToken('admin-browser');
        $memberToken = $member->createToken('student-browser');
        $session = $this->createSessionRecord(
            $member,
            $memberToken->accessToken->id,
            bin2hex(random_bytes(48)),
        );

        $this->withToken($adminToken->plainTextToken)
            ->getJson("/api/v1/organizations/{$organization->id}/member-sessions")
            ->assertOk()
            ->assertJsonPath('data.0.id', $session->id)
            ->assertJsonPath('data.0.user.email', $member->email);

        $this->withToken($adminToken->plainTextToken)
            ->deleteJson("/api/v1/organizations/{$organization->id}/members/{$member->id}/sessions")
            ->assertOk()
            ->assertJsonPath('data.revokedSessions', 1);

        $this->assertNotNull($session->fresh()->revoked_at);
        $this->assertDatabaseMissing('personal_access_tokens', [
            'id' => $memberToken->accessToken->id,
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'organization_id' => $organization->id,
            'actor_id' => $admin->id,
            'action' => 'session.revoked',
            'entity_id' => $member->id,
        ]);
    }

    private function createSessionRecord(
        User $user,
        ?int $accessTokenId,
        string $rawRefreshToken,
    ): UserSession {
        return UserSession::query()->create([
            'user_id' => $user->id,
            'access_token_id' => $accessTokenId,
            'name' => 'Test browser',
            'refresh_token_hash' => hash('sha256', $rawRefreshToken),
            'last_used_at' => now(),
            'expires_at' => now()->addDay(),
        ]);
    }
}
