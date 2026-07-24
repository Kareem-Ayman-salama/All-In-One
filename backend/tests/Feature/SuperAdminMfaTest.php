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
}
