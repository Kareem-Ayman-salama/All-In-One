<?php

namespace Tests\Feature;

use App\Models\User;
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
}
