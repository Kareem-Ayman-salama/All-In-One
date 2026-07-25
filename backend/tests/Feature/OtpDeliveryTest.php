<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\VerificationCodeNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OtpDeliveryTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_issues_and_sends_an_email_otp(): void
    {
        Notification::fake();

        $this->postJson('/api/v1/auth/register', [
            'name' => 'AIO Student',
            'email' => 'student@example.com',
            'password' => 'SecurePass123',
            'password_confirmation' => 'SecurePass123',
        ])->assertCreated()
            ->assertJsonPath('data.delivery', 'email');

        $user = User::query()->where('email', 'student@example.com')->firstOrFail();
        Notification::assertSentTo($user, VerificationCodeNotification::class);
        $this->assertDatabaseHas('verification_codes', [
            'user_id' => $user->id,
            'purpose' => 'email_verification',
            'attempts' => 0,
        ]);
    }

    public function test_otp_health_rejects_log_mail_and_accepts_free_smtp_mode(): void
    {
        config([
            'mail.default' => 'log',
            'mail.from.address' => 'noreply@aio.local',
            'queue.default' => 'database',
        ]);
        $this->getJson('/api/v1/health/otp')
            ->assertServiceUnavailable()
            ->assertJsonPath('data.status', 'not_ready');

        config([
            'mail.default' => 'smtp',
            'mail.from.address' => 'verified@aio.test',
            'mail.mailers.smtp.host' => 'smtp-relay.brevo.com',
            'mail.mailers.smtp.username' => 'brevo-user',
            'mail.mailers.smtp.password' => 'brevo-key',
            'queue.default' => 'sync',
        ]);
        $this->getJson('/api/v1/health/otp')
            ->assertOk()
            ->assertJsonPath('data.status', 'ready')
            ->assertJsonPath('data.checks.applicationKeyConfigured', true)
            ->assertJsonPath('data.checks.transactionalMail', true)
            ->assertJsonPath('data.checks.transportConfigured', true)
            ->assertJsonPath('data.checks.deliveryMode', true);
    }

    public function test_super_admin_can_send_an_otp_delivery_test_to_own_email(): void
    {
        Notification::fake();
        $admin = User::factory()->create(['email' => 'admin@aio.test']);
        $admin->forceFill(['platform_role' => 'super_admin'])->save();
        Sanctum::actingAs($admin);
        $this->configureSmtp();

        $this->getJson('/api/v1/admin/otp/status')
            ->assertOk()
            ->assertJsonPath('data.status', 'ready')
            ->assertJsonPath('data.sender', 've******@aio.test');

        $this->postJson('/api/v1/admin/otp/test')
            ->assertOk()
            ->assertJsonPath('data.deliveredTo', 'ad***@aio.test')
            ->assertJsonPath('data.expiresInMinutes', 15);

        Notification::assertSentTo(
            $admin,
            VerificationCodeNotification::class,
        );
        $this->assertDatabaseHas('verification_codes', [
            'user_id' => $admin->id,
            'purpose' => 'delivery_test',
            'attempts' => 0,
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'actor_id' => $admin->id,
            'action' => 'otp.delivery_test_sent',
        ]);
    }

    public function test_non_super_admin_cannot_access_otp_operations(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/admin/otp/status')
            ->assertForbidden()
            ->assertJsonPath('error.code', 'PLATFORM_ACCESS_DENIED');
        $this->postJson('/api/v1/admin/otp/test')
            ->assertForbidden()
            ->assertJsonPath('error.code', 'PLATFORM_ACCESS_DENIED');
    }

    public function test_unauthenticated_otp_operations_return_a_structured_401(): void
    {
        $this->getJson('/api/v1/admin/otp/status')
            ->assertUnauthorized()
            ->assertJsonPath('error.code', 'AUTHENTICATION_REQUIRED');
        $this->postJson('/api/v1/admin/otp/test')
            ->assertUnauthorized()
            ->assertJsonPath('error.code', 'AUTHENTICATION_REQUIRED');
    }

    public function test_delivery_test_is_blocked_until_smtp_is_configured(): void
    {
        Notification::fake();
        $admin = User::factory()->create();
        $admin->forceFill(['platform_role' => 'super_admin'])->save();
        Sanctum::actingAs($admin);

        config([
            'mail.default' => 'log',
            'mail.from.address' => 'noreply@aio.local',
        ]);

        $this->getJson('/api/v1/admin/otp/status')
            ->assertOk()
            ->assertJsonPath('data.status', 'not_ready');
        $this->postJson('/api/v1/admin/otp/test')
            ->assertServiceUnavailable()
            ->assertJsonPath('error.code', 'OTP_DELIVERY_NOT_CONFIGURED');
        Notification::assertNothingSent();
    }

    private function configureSmtp(): void
    {
        config([
            'mail.default' => 'smtp',
            'mail.from.address' => 'verified@aio.test',
            'mail.mailers.smtp.host' => 'smtp-relay.brevo.com',
            'mail.mailers.smtp.username' => 'brevo-user',
            'mail.mailers.smtp.password' => 'brevo-key',
            'queue.default' => 'database',
        ]);
    }
}
