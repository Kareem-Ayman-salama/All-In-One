<?php

namespace App\Services\Auth;

use App\Exceptions\ApiException;
use App\Models\User;
use App\Models\VerificationCode;
use Illuminate\Support\Facades\DB;

class VerificationCodeService
{
    public function issue(User $user, string $purpose): string
    {
        $code = (string) random_int(100000, 999999);

        DB::transaction(function () use ($user, $purpose, $code): void {
            User::query()
                ->whereKey($user->id)
                ->lockForUpdate()
                ->firstOrFail();
            VerificationCode::query()
                ->where('email', $user->normalized_email)
                ->where('purpose', $purpose)
                ->whereNull('used_at')
                ->lockForUpdate()
                ->update(['used_at' => now()]);

            VerificationCode::query()->create([
                'user_id' => $user->id,
                'email' => $user->normalized_email,
                'purpose' => $purpose,
                'code_hash' => hash('sha256', $code),
                'expires_at' => now()->addMinutes(15),
            ]);
        });

        return $code;
    }

    public function consume(string $email, string $purpose, string $code): VerificationCode
    {
        $result = DB::transaction(function () use (
            $email,
            $purpose,
            $code,
        ): array {
            $verification = VerificationCode::query()
                ->where('email', mb_strtolower(trim($email)))
                ->where('purpose', $purpose)
                ->whereNull('used_at')
                ->latest()
                ->lockForUpdate()
                ->first();

            if (! $verification || $verification->expires_at->isPast()) {
                return ['error' => 'INVALID_CODE'];
            }

            if ($verification->attempts >= 5) {
                return ['error' => 'RATE_LIMITED'];
            }

            $verification->increment('attempts');

            if (! hash_equals(
                $verification->code_hash,
                hash('sha256', $code),
            )) {
                return ['error' => 'INVALID_CODE'];
            }

            $verification->forceFill(['used_at' => now()])->save();

            return ['verification' => $verification];
        });

        if (($result['error'] ?? null) === 'RATE_LIMITED') {
            throw new ApiException(
                'RATE_LIMITED',
                'Too many verification attempts.',
                429,
            );
        }
        if (isset($result['error'])) {
            throw new ApiException(
                'INVALID_CODE',
                'The verification code is invalid or expired.',
                422,
            );
        }

        return $result['verification'];
    }
}
