<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SuperAdminMfaTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_receives_no_token_until_mfa_is_verified(): void
    {
        $admin = User::factory()->create([
            'email' => 'admin@aio.test',
            'password' => 'StrongPassword123!',
        ]);
        $admin->forceFill(['platform_role' => 'super_admin'])->save();

        $challenge = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@aio.test',
            'password' => 'StrongPassword123!',
        ]);
        $challenge
            ->assertStatus(202)
            ->assertJsonPath('data.mfaRequired', true)
            ->assertJsonMissingPath('data.accessToken');
        $code = $challenge->json('data.debugCode');
        $this->assertIsString($code);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@aio.test',
            'password' => 'StrongPassword123!',
            'mfaCode' => '000000',
        ])
            ->assertUnprocessable()
            ->assertJsonPath('error.code', 'INVALID_CODE');

        $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@aio.test',
            'password' => 'StrongPassword123!',
            'mfaCode' => $code,
        ])
            ->assertOk()
            ->assertJsonPath('data.mfaRequired', false)
            ->assertJsonStructure(['data' => ['accessToken', 'user']]);
    }

    public function test_enabled_demo_super_admin_uses_scoped_fixed_mfa_code(): void
    {
        config()->set('aio.demo_access.enabled', true);
        config()->set('aio.demo_access.super_admin_email', 'super@ain.test');
        config()->set('aio.demo_access.super_admin_mfa_code', '123456');

        $admin = User::factory()->create([
            'email' => 'super@ain.test',
            'password' => 'StrongPassword123!',
        ]);
        $admin->forceFill(['platform_role' => 'super_admin'])->save();

        $this->postJson('/api/v1/auth/login', [
            'email' => 'super@ain.test',
            'password' => 'StrongPassword123!',
        ])
            ->assertStatus(202)
            ->assertJsonPath('data.mfaRequired', true)
            ->assertJsonMissingPath('data.debugCode');

        $this->postJson('/api/v1/auth/login', [
            'email' => 'super@ain.test',
            'password' => 'StrongPassword123!',
            'mfaCode' => '654321',
        ])
            ->assertUnprocessable()
            ->assertJsonPath('error.code', 'INVALID_CODE');

        $this->postJson('/api/v1/auth/login', [
            'email' => 'super@ain.test',
            'password' => 'StrongPassword123!',
            'mfaCode' => '123456',
        ])
            ->assertOk()
            ->assertJsonPath('data.mfaRequired', false)
            ->assertJsonPath('data.user.role', 'super-admin');
    }

    public function test_demo_mfa_code_never_applies_to_a_different_admin(): void
    {
        config()->set('aio.demo_access.enabled', true);
        config()->set('aio.demo_access.super_admin_email', 'super@ain.test');
        config()->set('aio.demo_access.super_admin_mfa_code', '123456');

        $admin = User::factory()->create([
            'email' => 'other-admin@ain.test',
            'password' => 'StrongPassword123!',
        ]);
        $admin->forceFill(['platform_role' => 'super_admin'])->save();

        $this->postJson('/api/v1/auth/login', [
            'email' => 'other-admin@ain.test',
            'password' => 'StrongPassword123!',
        ])
            ->assertStatus(202)
            ->assertJsonPath('data.mfaRequired', true)
            ->assertJsonStructure(['data' => ['debugCode']]);
    }
}
