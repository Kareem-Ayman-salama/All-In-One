<?php

namespace Tests\Feature;

use App\Models\PushDeviceToken;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PushDeviceTokenTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_register_and_refresh_push_token(): void
    {
        $accessToken = $this->loginAndReturnAccessToken();
        $token = str_repeat('a', 80);

        $this->withToken($accessToken)
            ->postJson('/api/v1/devices/push-tokens', [
                'token' => $token,
                'platform' => 'android',
                'installationId' => 'install-test-device',
                'deviceName' => 'Pixel 9',
                'appVersion' => '1.0.0',
            ])
            ->assertOk()
            ->assertJsonPath('data.platform', 'android')
            ->assertJsonPath('data.installationId', 'install-test-device');

        $this->assertDatabaseHas('push_device_tokens', [
            'installation_id' => 'install-test-device',
            'token_hash' => hash('sha256', $token),
            'revoked_at' => null,
        ]);

        $updatedToken = str_repeat('b', 80);
        $this->withToken($accessToken)
            ->postJson('/api/v1/devices/push-tokens', [
                'token' => $updatedToken,
                'platform' => 'android',
                'installationId' => 'install-test-device',
            ])
            ->assertOk();

        $this->assertSame(1, PushDeviceToken::query()->count());
        $this->assertDatabaseHas('push_device_tokens', [
            'installation_id' => 'install-test-device',
            'token_hash' => hash('sha256', $updatedToken),
            'revoked_at' => null,
        ]);
    }

    public function test_push_token_registration_requires_supported_platform(): void
    {
        $accessToken = $this->loginAndReturnAccessToken();

        $this->withToken($accessToken)
            ->postJson('/api/v1/devices/push-tokens', [
                'token' => str_repeat('a', 80),
                'platform' => 'desktop',
                'installationId' => 'install-test-device',
            ])
            ->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR');
    }

    public function test_logout_revokes_current_session_push_tokens(): void
    {
        $accessToken = $this->loginAndReturnAccessToken();

        $this->withToken($accessToken)
            ->postJson('/api/v1/devices/push-tokens', [
                'token' => str_repeat('a', 80),
                'platform' => 'ios',
                'installationId' => 'ios-installation',
            ])
            ->assertOk();

        $this->assertNotNull(
            PushDeviceToken::query()
                ->where('installation_id', 'ios-installation')
                ->value('user_session_id'),
        );

        $this->withToken($accessToken)
            ->postJson('/api/v1/auth/logout')
            ->assertOk();

        $this->assertDatabaseMissing('push_device_tokens', [
            'installation_id' => 'ios-installation',
            'revoked_at' => null,
        ]);
    }

    private function loginAndReturnAccessToken(): string
    {
        User::factory()->create([
            'email' => 'mobile@example.com',
            'password' => Hash::make('SecurePass123'),
        ]);

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => 'mobile@example.com',
            'password' => 'SecurePass123',
            'deviceName' => 'Mobile test device',
        ]);

        $login->assertOk();

        return (string) $login->json('data.accessToken');
    }
}
