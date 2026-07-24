<?php

namespace Tests\Feature;

use App\Exceptions\ApiException;
use App\Models\User;
use App\Models\VerificationCode;
use App\Services\Auth\VerificationCodeService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VerificationCodeSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_failed_attempts_are_persisted_and_lock_the_code(): void
    {
        $user = User::factory()->create();
        $service = app(VerificationCodeService::class);
        $service->issue($user, 'password_reset');

        for ($attempt = 1; $attempt <= 5; $attempt++) {
            try {
                $service->consume(
                    $user->email,
                    'password_reset',
                    '000000',
                );
                $this->fail('An incorrect verification code was accepted.');
            } catch (ApiException $exception) {
                $this->assertSame('INVALID_CODE', $exception->errorCode);
            }
        }

        $this->assertDatabaseHas('verification_codes', [
            'user_id' => $user->id,
            'purpose' => 'password_reset',
            'attempts' => 5,
            'used_at' => null,
        ]);

        $this->expectException(ApiException::class);
        $this->expectExceptionMessage('Too many verification attempts.');
        $service->consume($user->email, 'password_reset', '000000');
    }

    public function test_verification_code_can_only_be_consumed_once(): void
    {
        $user = User::factory()->create();
        $service = app(VerificationCodeService::class);
        $code = $service->issue($user, 'password_reset');

        $verification = $service->consume(
            $user->email,
            'password_reset',
            $code,
        );
        $this->assertNotNull($verification->used_at);

        $this->expectException(ApiException::class);
        $this->expectExceptionMessage(
            'The verification code is invalid or expired.',
        );
        $service->consume($user->email, 'password_reset', $code);
    }

    public function test_issuing_a_new_code_invalidates_the_previous_one(): void
    {
        $user = User::factory()->create();
        $service = app(VerificationCodeService::class);
        $service->issue($user, 'email_verification');
        $service->issue($user, 'email_verification');

        $this->assertSame(
            1,
            VerificationCode::query()
                ->where('user_id', $user->id)
                ->where('purpose', 'email_verification')
                ->whereNull('used_at')
                ->count(),
        );
    }
}
