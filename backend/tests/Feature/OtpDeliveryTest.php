<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\VerificationCodeNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
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
            'queue.default' => 'sync',
        ]);
        $this->getJson('/api/v1/health/otp')
            ->assertOk()
            ->assertJsonPath('data.status', 'ready')
            ->assertJsonPath('data.checks.transactionalMail', true)
            ->assertJsonPath('data.checks.deliveryMode', true);
    }
}
