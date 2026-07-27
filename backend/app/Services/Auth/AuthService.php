<?php

namespace App\Services\Auth;

use App\Exceptions\ApiException;
use App\Models\PushDeviceToken;
use App\Models\User;
use App\Models\UserSession;
use App\Notifications\VerificationCodeNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthService
{
    public function __construct(
        private readonly VerificationCodeService $verificationCodes,
    ) {}

    /**
     * @param  array{name:string,email:string,password:string}  $data
     * @return array{user:User,debugCode:?string}
     */
    public function register(array $data): array
    {
        return DB::transaction(function () use ($data): array {
            $user = User::query()->create([
                'name' => trim($data['name']),
                'email' => $data['email'],
                'password' => $data['password'],
                'status' => 'pending_verification',
            ]);

            $code = $this->verificationCodes->issue($user, 'email_verification');
            $user->notify(new VerificationCodeNotification($code, 'email_verification'));

            return [
                'user' => $user,
                'debugCode' => app()->environment(['local', 'testing']) ? $code : null,
            ];
        });
    }

    /**
     * @return array{user:User,accessToken:string,refreshToken:string}
     */
    public function verifyEmail(
        string $email,
        string $code,
        Request $request,
    ): array {
        $verification = $this->verificationCodes->consume(
            $email,
            'email_verification',
            $code,
        );
        $user = User::query()->findOrFail($verification->user_id);
        $user->forceFill([
            'email_verified_at' => now(),
            'status' => 'active',
        ])->save();

        return $this->createSession(
            $user,
            $request,
            true,
            ['deviceName' => 'Verified browser'],
        );
    }

    public function resendVerification(string $email): ?string
    {
        $user = User::query()->where('normalized_email', $email)->first();
        if (! $user || $user->email_verified_at) {
            return null;
        }

        $code = $this->verificationCodes->issue($user, 'email_verification');
        $user->notify(new VerificationCodeNotification($code, 'email_verification'));

        return app()->environment(['local', 'testing']) ? $code : null;
    }

    /**
     * @return array{
     *   user:User,
     *   mfaRequired:bool,
     *   accessToken?:string,
     *   refreshToken?:string,
     *   debugCode?:?string
     * }
     */
    public function login(
        string $email,
        string $password,
        Request $request,
        bool $remember,
        ?array $device = null,
        ?string $mfaCode = null,
    ): array {
        $user = User::query()
            ->where('normalized_email', $email)
            ->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            throw new ApiException('INVALID_CREDENTIALS', 'Email or password is incorrect.', 401);
        }

        $this->ensureAccountIsActive($user);

        if (! $user->email_verified_at) {
            throw new ApiException('EMAIL_NOT_VERIFIED', 'Verify your email before signing in.', 403);
        }

        if ($user->platform_role === 'super_admin') {
            $demoMfaCode = $this->demoSuperAdminMfaCode($user);
            if ($demoMfaCode !== null) {
                if (! $mfaCode) {
                    return [
                        'user' => $user,
                        'mfaRequired' => true,
                        'debugCode' => null,
                    ];
                }
                if (! hash_equals($demoMfaCode, $mfaCode)) {
                    throw new ApiException(
                        'INVALID_CODE',
                        'The verification code is invalid or expired.',
                        422,
                    );
                }
            } elseif (! $mfaCode) {
                $code = $this->verificationCodes->issue($user, 'mfa_login');
                $user->notify(new VerificationCodeNotification($code, 'mfa_login'));

                return [
                    'user' => $user,
                    'mfaRequired' => true,
                    'debugCode' => app()->environment(['local', 'testing'])
                        ? $code
                        : null,
                ];
            } else {
                $this->verificationCodes->consume(
                    $user->normalized_email,
                    'mfa_login',
                    $mfaCode,
                );
            }
        }

        $user->forceFill(['last_login_at' => now()])->save();

        return [
            ...$this->createSession($user, $request, $remember, $device),
            'mfaRequired' => false,
        ];
    }

    private function demoSuperAdminMfaCode(User $user): ?string
    {
        if (! config('aio.demo_access.enabled')) {
            return null;
        }

        $email = (string) config('aio.demo_access.super_admin_email');
        $code = (string) config('aio.demo_access.super_admin_mfa_code');
        if (
            $email === ''
            || $user->normalized_email !== $email
            || preg_match('/^\d{6}$/', $code) !== 1
        ) {
            return null;
        }

        return $code;
    }

    /**
     * @return array{user:User,accessToken:string,refreshToken:string}
     */
    public function refresh(string $rawRefreshToken, Request $request): array
    {
        $result = DB::transaction(function () use ($rawRefreshToken, $request): array {
            $hash = hash('sha256', $rawRefreshToken);
            $session = UserSession::query()
                ->where('refresh_token_hash', $hash)
                ->lockForUpdate()
                ->first();

            if (! $session) {
                throw new ApiException('SESSION_EXPIRED', 'The session has expired.', 401);
            }

            if ($session->revoked_at) {
                UserSession::query()
                    ->where('user_id', $session->user_id)
                    ->whereNull('revoked_at')
                    ->update(['revoked_at' => now()]);
                PushDeviceToken::query()
                    ->where('user_id', $session->user_id)
                    ->whereNull('revoked_at')
                    ->update(['revoked_at' => now()]);
                $session->user?->tokens()->delete();

                return ['error' => 'SESSION_REUSE_DETECTED'];
            }

            if ($session->expires_at->isPast()) {
                $session->forceFill(['revoked_at' => now()])->save();

                return ['error' => 'SESSION_EXPIRED'];
            }

            $user = $session->user;
            if (! $user || $user->status !== 'active') {
                $session->forceFill(['revoked_at' => now()])->save();

                if ($user) {
                    $user->tokens()->delete();
                    UserSession::query()
                        ->where('user_id', $user->id)
                        ->whereNull('revoked_at')
                        ->update(['revoked_at' => now()]);
                    PushDeviceToken::query()
                        ->where('user_id', $user->id)
                        ->whereNull('revoked_at')
                        ->update(['revoked_at' => now()]);
                }

                return ['error' => 'ACCOUNT_DISABLED'];
            }

            $session->forceFill(['revoked_at' => now()])->save();
            $session->accessToken?->delete();

            return $this->createSession(
                $user,
                $request,
                true,
                [
                    'deviceName' => $session->name,
                    'installationId' => $session->installation_id,
                    'platform' => $session->platform,
                    'appVersion' => $session->app_version,
                ],
            );
        });

        if (isset($result['error'])) {
            throw match ($result['error']) {
                'SESSION_REUSE_DETECTED' => new ApiException(
                    'SESSION_REUSE_DETECTED',
                    'The session was revoked for security.',
                    401,
                ),
                'ACCOUNT_DISABLED' => new ApiException(
                    'ACCOUNT_DISABLED',
                    'This account is not available.',
                    403,
                ),
                default => new ApiException(
                    'SESSION_EXPIRED',
                    'The session has expired.',
                    401,
                ),
            };
        }

        return $result;
    }

    public function logout(
        User $user,
        ?string $rawRefreshToken,
        int|string|null $authenticatedAccessTokenId = null,
    ): void {
        $accessTokenId = $authenticatedAccessTokenId
            ?? $user->currentAccessToken()?->getKey();

        if ($rawRefreshToken) {
            $session = UserSession::query()
                ->where('user_id', $user->id)
                ->where('refresh_token_hash', hash('sha256', $rawRefreshToken))
                ->whereNull('revoked_at')
                ->first();
        } elseif ($accessTokenId) {
            $session = UserSession::query()
                ->where('user_id', $user->id)
                ->where('access_token_id', $accessTokenId)
                ->whereNull('revoked_at')
                ->first();
        }

        if (isset($session) && $session) {
            $session->forceFill(['revoked_at' => now()])->save();
            PushDeviceToken::query()
                ->where('user_session_id', $session->id)
                ->whereNull('revoked_at')
                ->update(['revoked_at' => now()]);
        }

        $user->currentAccessToken()?->delete();
    }

    public function requestPasswordReset(string $email): ?string
    {
        $user = User::query()->where('normalized_email', $email)->first();
        if (! $user) {
            return null;
        }

        $code = $this->verificationCodes->issue($user, 'password_reset');
        $user->notify(new VerificationCodeNotification($code, 'password_reset'));

        return app()->environment(['local', 'testing']) ? $code : null;
    }

    public function resetPassword(string $email, string $code, string $password): void
    {
        $verification = $this->verificationCodes->consume($email, 'password_reset', $code);
        $user = User::query()->findOrFail($verification->user_id);

        DB::transaction(function () use ($user, $password): void {
            $user->forceFill(['password' => $password])->save();
            $user->tokens()->delete();
            UserSession::query()
                ->where('user_id', $user->id)
                ->whereNull('revoked_at')
                ->update(['revoked_at' => now()]);
            PushDeviceToken::query()
                ->where('user_id', $user->id)
                ->whereNull('revoked_at')
                ->update(['revoked_at' => now()]);
        });
    }

    public function changePassword(User $user, string $password): void
    {
        DB::transaction(function () use ($user, $password): void {
            $user->forceFill(['password' => $password])->save();
            UserSession::query()
                ->where('user_id', $user->id)
                ->whereNull('revoked_at')
                ->update(['revoked_at' => now()]);
            PushDeviceToken::query()
                ->where('user_id', $user->id)
                ->whereNull('revoked_at')
                ->update(['revoked_at' => now()]);
            $user->tokens()->delete();
        });
    }

    /**
     * @return array{user:User,accessToken:string,refreshToken:string}
     */
    private function createSession(
        User $user,
        Request $request,
        bool $remember,
        ?array $device = null,
    ): array {
        $installationId = $device['installationId'] ?? null;
        $this->enforceDeviceLimit($user, $installationId);

        $accessExpiresAt = now()->addMinutes(config('aio.access_token_minutes'));
        $accessToken = $user->createToken('web', ['*'], $accessExpiresAt);
        $rawRefreshToken = bin2hex(random_bytes(48));
        $refreshDays = $remember ? config('aio.refresh_token_days') : 1;

        UserSession::query()->create([
            'user_id' => $user->id,
            'access_token_id' => $accessToken->accessToken->getKey(),
            'name' => ($device['deviceName'] ?? null)
                ?: Str::limit((string) $request->userAgent(), 120),
            'installation_id' => $installationId,
            'platform' => $device['platform'] ?? null,
            'app_version' => $device['appVersion'] ?? null,
            'refresh_token_hash' => hash('sha256', $rawRefreshToken),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'last_used_at' => now(),
            'expires_at' => now()->addDays($refreshDays),
        ]);

        return [
            'user' => $user,
            'accessToken' => $accessToken->plainTextToken,
            'refreshToken' => $rawRefreshToken,
        ];
    }

    private function enforceDeviceLimit(User $user, ?string $installationId): void
    {
        if (
            $installationId
            && (bool) config('device_policy.allow_same_installation_replacement')
        ) {
            UserSession::query()
                ->where('user_id', $user->id)
                ->where('installation_id', $installationId)
                ->whereNull('revoked_at')
                ->update(['revoked_at' => now()]);
        }

        $activeSessions = UserSession::query()
            ->where('user_id', $user->id)
            ->whereNull('revoked_at')
            ->count();

        if ($activeSessions >= (int) config('device_policy.max_active_sessions_per_user')) {
            throw new ApiException(
                'DEVICE_LIMIT_REACHED',
                'Too many active devices. Revoke a device session and try again.',
                403,
            );
        }
    }

    private function ensureAccountIsActive(User $user): void
    {
        if ($user->status !== 'active') {
            throw new ApiException(
                'ACCOUNT_DISABLED',
                'This account is not available.',
                403,
            );
        }
    }
}
