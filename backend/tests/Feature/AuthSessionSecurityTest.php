<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserSession;
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
