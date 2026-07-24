<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Http\Requests\Auth\VerifyEmailRequest;
use App\Services\Auth\AuthService;
use App\Services\Auth\UserPresenter;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\Cookie;

class AuthController extends Controller
{
    public function __construct(
        private readonly AuthService $auth,
        private readonly UserPresenter $presenter,
    ) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        $result = $this->auth->register($request->validated());
        $data = [
            'user' => $this->presenter->present($result['user']),
            'delivery' => 'email',
        ];

        if ($result['debugCode']) {
            $data['debugCode'] = $result['debugCode'];
        }

        return ApiResponse::success($request, $data, status: 201);
    }

    public function verifyEmail(VerifyEmailRequest $request): JsonResponse
    {
        $result = $this->auth->verifyEmail(
            $request->string('email')->toString(),
            $request->string('code')->toString(),
            $request,
        );

        return ApiResponse::success($request, [
            'user' => $this->presenter->present($result['user']),
            'accessToken' => $result['accessToken'],
            'token' => $result['accessToken'],
            'refreshToken' => $result['refreshToken'],
        ])->withCookie($this->refreshCookie($result['refreshToken']));
    }

    public function resendVerification(ForgotPasswordRequest $request): JsonResponse
    {
        $debugCode = $this->auth->resendVerification(
            $request->string('email')->toString(),
        );
        $data = ['accepted' => true, 'delivery' => 'email'];

        if ($debugCode) {
            $data['debugCode'] = $debugCode;
        }

        return ApiResponse::success($request, $data);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->auth->login(
            $request->string('email')->toString(),
            $request->string('password')->toString(),
            $request,
            $request->boolean('remember', true),
            [
                'deviceName' => $request->input('deviceName'),
                'installationId' => $request->input('installationId'),
                'platform' => $request->input('platform'),
                'appVersion' => $request->input('appVersion'),
            ],
            $request->input('mfaCode'),
        );

        if ($result['mfaRequired']) {
            $data = [
                'mfaRequired' => true,
                'method' => 'email_otp',
                'expiresInSeconds' => 900,
            ];
            if ($result['debugCode'] ?? null) {
                $data['debugCode'] = $result['debugCode'];
            }

            return ApiResponse::success($request, $data, status: 202);
        }

        $response = ApiResponse::success($request, [
            'user' => $this->presenter->present($result['user']),
            'accessToken' => $result['accessToken'],
            'token' => $result['accessToken'],
            'refreshToken' => $result['refreshToken'],
            'mfaRequired' => false,
        ]);

        return $response->withCookie($this->refreshCookie($result['refreshToken']));
    }

    public function refresh(Request $request): JsonResponse
    {
        $refreshToken = $request->cookie(config('aio.refresh_cookie'))
            ?: $request->input('refreshToken');

        if (! is_string($refreshToken) || $refreshToken === '') {
            throw new ApiException('SESSION_EXPIRED', 'The session has expired.', 401);
        }

        $result = $this->auth->refresh($refreshToken, $request);
        $response = ApiResponse::success($request, [
            'user' => $this->presenter->present($result['user']),
            'accessToken' => $result['accessToken'],
            'token' => $result['accessToken'],
            'refreshToken' => $result['refreshToken'],
        ]);

        return $response->withCookie($this->refreshCookie($result['refreshToken']));
    }

    public function logout(Request $request): JsonResponse
    {
        $accessTokenId = $request->user()->currentAccessToken()?->getKey();
        if (! $accessTokenId && str_contains((string) $request->bearerToken(), '|')) {
            $accessTokenId = explode('|', (string) $request->bearerToken(), 2)[0];
        }
        $this->auth->logout(
            $request->user(),
            $request->cookie(config('aio.refresh_cookie')),
            $accessTokenId,
        );

        return ApiResponse::success($request, ['loggedOut' => true])
            ->withoutCookie(config('aio.refresh_cookie'));
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $debugCode = $this->auth->requestPasswordReset(
            $request->string('email')->toString(),
        );
        $data = ['accepted' => true, 'delivery' => 'email'];

        if ($debugCode) {
            $data['debugCode'] = $debugCode;
        }

        return ApiResponse::success($request, $data, status: 202);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $this->auth->resetPassword(
            $request->string('email')->toString(),
            $request->string('code')->toString(),
            $request->string('password')->toString(),
        );

        return ApiResponse::success($request, ['passwordChanged' => true]);
    }

    public function me(Request $request): JsonResponse
    {
        return ApiResponse::success($request, [
            'user' => $this->presenter->present($request->user()),
        ]);
    }

    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->fill($request->validated())->save();

        return ApiResponse::success($request, [
            'user' => $this->presenter->present($user->fresh()),
        ]);
    }

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $user = $request->user();
        if (! Hash::check(
            $request->string('currentPassword')->toString(),
            $user->password,
        )) {
            throw new ApiException(
                'CURRENT_PASSWORD_INCORRECT',
                'The current password is incorrect.',
                422,
            );
        }

        $this->auth->changePassword(
            $user,
            $request->string('newPassword')->toString(),
        );

        return ApiResponse::success($request, [
            'passwordChanged' => true,
            'reauthenticationRequired' => true,
        ])->withoutCookie(config('aio.refresh_cookie'));
    }

    private function refreshCookie(string $token): Cookie
    {
        return cookie(
            config('aio.refresh_cookie'),
            $token,
            config('aio.refresh_token_days') * 24 * 60,
            '/',
            null,
            config('aio.cookie_secure'),
            true,
            false,
            config('aio.cookie_same_site'),
        );
    }
}
