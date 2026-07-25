<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Models\VerificationCode;
use App\Notifications\VerificationCodeNotification;
use App\Services\Auth\OtpReadinessService;
use App\Services\Auth\VerificationCodeService;
use App\Services\Operations\OperationRecorder;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class OtpOperationsController extends Controller
{
    public function status(
        Request $request,
        OtpReadinessService $readiness,
    ): JsonResponse {
        return ApiResponse::success($request, $readiness->report());
    }

    public function sendTest(
        Request $request,
        OtpReadinessService $readiness,
        VerificationCodeService $codes,
        OperationRecorder $recorder,
    ): JsonResponse {
        $report = $readiness->report();
        if ($report['status'] !== 'ready') {
            throw new ApiException(
                'OTP_DELIVERY_NOT_CONFIGURED',
                'Configure a transactional mail provider and verified sender first.',
                503,
                ['checks' => $report['checks']],
            );
        }

        $user = $request->user();
        $code = $codes->issue($user, 'delivery_test');

        try {
            $user->notify(new VerificationCodeNotification(
                $code,
                'delivery_test',
            ));
        } catch (Throwable $exception) {
            VerificationCode::query()
                ->where('user_id', $user->id)
                ->where('purpose', 'delivery_test')
                ->whereNull('used_at')
                ->update(['used_at' => now()]);
            report($exception);

            throw new ApiException(
                'OTP_DELIVERY_FAILED',
                'The OTP message could not be delivered. Check the mail provider settings.',
                502,
            );
        }

        $recorder->record(
            'otp.delivery_test_sent',
            'user',
            $user->id,
            null,
            $user->id,
            ['channel' => 'email'],
            ['purpose' => 'delivery_test'],
            $request,
        );

        return ApiResponse::success($request, [
            'deliveredTo' => $this->maskEmail($user->email),
            'expiresInMinutes' => 15,
        ]);
    }

    private function maskEmail(string $email): string
    {
        [$local, $domain] = explode('@', $email, 2);
        $visible = mb_substr($local, 0, min(2, mb_strlen($local)));

        return $visible.str_repeat('*', max(3, mb_strlen($local) - 2)).'@'.$domain;
    }
}
