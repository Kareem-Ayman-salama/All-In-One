<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_verification_login_refresh_and_logout_cycle(): void
    {
        $register = $this->postJson('/api/v1/auth/register', [
            'name' => 'Kareem Ayman',
            'email' => 'KAREEM@example.com',
            'password' => 'SecurePass123',
            'password_confirmation' => 'SecurePass123',
        ]);

        $register->assertCreated()
            ->assertJsonPath('data.user.email', 'kareem@example.com')
            ->assertJsonPath('data.user.emailVerified', false)
            ->assertJsonStructure(['data' => ['debugCode'], 'requestId']);

        $code = $register->json('data.debugCode');

        $this->postJson('/api/v1/auth/verify-email', [
            'email' => 'kareem@example.com',
            'code' => $code,
        ])->assertOk()
            ->assertJsonPath('data.user.emailVerified', true)
            ->assertJsonStructure(['data' => ['accessToken']])
            ->assertCookie(config('aio.refresh_cookie'));

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => 'kareem@example.com',
            'password' => 'SecurePass123',
            'remember' => true,
            'deviceName' => 'Test browser',
        ]);

        $login->assertOk()
            ->assertJsonStructure([
                'data' => ['user', 'accessToken', 'token'],
                'requestId',
            ])
            ->assertCookie(config('aio.refresh_cookie'));

        $accessToken = $login->json('data.accessToken');

        $this->withToken($accessToken)
            ->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.user.email', 'kareem@example.com');

        $this->withToken($accessToken)
            ->postJson('/api/v1/auth/logout')
            ->assertOk()
            ->assertJsonPath('data.loggedOut', true);

        // Logout revokes only the current device. The access token created
        // after email verification represents a separate active session.
        $this->assertDatabaseCount('personal_access_tokens', 1);
        $this->app['auth']->forgetGuards();

        $this->withToken($accessToken)
            ->getJson('/api/v1/auth/me')
            ->assertUnauthorized();
    }

    public function test_login_uses_generic_invalid_credentials_error(): void
    {
        $this->postJson('/api/v1/auth/login', [
            'email' => 'missing@example.com',
            'password' => 'WrongPassword123',
        ])->assertUnauthorized()
            ->assertJsonPath('error.code', 'INVALID_CREDENTIALS');
    }

    public function test_registration_rejects_weak_passwords(): void
    {
        $this->postJson('/api/v1/auth/register', [
            'name' => 'Weak Password',
            'email' => 'weak@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR');
    }

    public function test_disabled_account_cannot_use_an_existing_access_token(): void
    {
        $user = User::factory()->create(['status' => 'disabled']);
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/auth/me')
            ->assertForbidden()
            ->assertJsonPath('error.code', 'ACCOUNT_DISABLED');
    }

    public function test_disabled_account_cannot_rotate_a_refresh_token(): void
    {
        $rawToken = bin2hex(random_bytes(48));
        $user = User::factory()->create(['status' => 'disabled']);
        UserSession::query()->create([
            'user_id' => $user->id,
            'name' => 'Disabled browser',
            'refresh_token_hash' => hash('sha256', $rawToken),
            'expires_at' => now()->addDay(),
        ]);

        $this->postJson('/api/v1/auth/refresh', [
            'refreshToken' => $rawToken,
        ])
            ->assertForbidden()
            ->assertJsonPath('error.code', 'ACCOUNT_DISABLED');

        $this->assertDatabaseMissing('user_sessions', [
            'user_id' => $user->id,
            'revoked_at' => null,
        ]);
    }

    public function test_refresh_token_reuse_revokes_every_active_session(): void
    {
        $reusedToken = bin2hex(random_bytes(48));
        $activeToken = bin2hex(random_bytes(48));
        $user = User::factory()->create();
        UserSession::query()->create([
            'user_id' => $user->id,
            'name' => 'Previously rotated browser',
            'refresh_token_hash' => hash('sha256', $reusedToken),
            'expires_at' => now()->addDay(),
            'revoked_at' => now()->subMinute(),
        ]);
        UserSession::query()->create([
            'user_id' => $user->id,
            'name' => 'Active browser',
            'refresh_token_hash' => hash('sha256', $activeToken),
            'expires_at' => now()->addDay(),
        ]);
        $user->createToken('web');

        $this->postJson('/api/v1/auth/refresh', [
            'refreshToken' => $reusedToken,
        ])
            ->assertUnauthorized()
            ->assertJsonPath('error.code', 'SESSION_REUSE_DETECTED');

        $this->assertDatabaseMissing('user_sessions', [
            'user_id' => $user->id,
            'revoked_at' => null,
        ]);
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }
}
