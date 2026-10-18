<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Auth\OtpReadinessService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Redis;
use Throwable;

class HealthController extends Controller
{
    /**
     * Production-safe health endpoint returning status of core systems without leaking secrets.
     */
    public function index(Request $request): JsonResponse
    {
        $dbOk = $this->databaseCheck();
        $cacheOk = $this->cacheCheck();
        $queueOk = $this->queueCheck();

        $storageConfigured = ! empty(config('filesystems.disks.s3.key'))
            || config('filesystems.default') === 'local'
            || ! empty(config('filesystems.disks.s3.bucket'));

        $hasPaymob = ! empty(config('services.paymob.api_key'))
            && ! empty(config('services.paymob.hmac_secret'));

        $isHealthy = $dbOk;

        return response()->json([
            'status' => $isHealthy ? 'healthy' : 'degraded',
            'api' => 'ok',
            'database' => $dbOk ? 'ok' : 'failed',
            'cache' => $cacheOk ? 'ok' : 'degraded',
            'queue' => $queueOk ? 'ok' : 'degraded',
            'storage' => $storageConfigured ? 'configured' : 'not_configured',
            'payments' => $hasPaymob ? 'configured' : 'not_configured',
            'version' => config('app.version', '1.0.0-pilot'),
        ], $isHealthy ? 200 : 503);
    }

    public function live(Request $request): JsonResponse
    {
        return ApiResponse::success($request, [
            'status' => 'ok',
            'service' => 'aio-api',
            'time' => now()->toIso8601String(),
        ]);
    }

    public function ready(Request $request): JsonResponse
    {
        $checks = ['database' => $this->databaseCheck()];

        if (config('aio.redis_required')) {
            $checks['redis'] = $this->redisCheck();
        }

        $ready = ! in_array(false, $checks, true);

        return ApiResponse::success(
            $request,
            ['status' => $ready ? 'ready' : 'not_ready', 'checks' => $checks],
            status: $ready ? 200 : 503,
        );
    }

    public function otp(
        Request $request,
        OtpReadinessService $readiness,
    ): JsonResponse {
        $report = $readiness->report();

        return ApiResponse::success($request, [
            'status' => $report['status'],
            'checks' => $report['checks'],
            'mailer' => $report['mailer'],
            'queue' => $report['queue'],
        ], status: $report['status'] === 'ready' ? 200 : 503);
    }

    private function databaseCheck(): bool
    {
        try {
            DB::select('select 1');

            return true;
        } catch (Throwable) {
            return false;
        }
    }

    private function redisCheck(): bool
    {
        try {
            return Redis::connection()->ping() !== false;
        } catch (Throwable) {
            return false;
        }
    }

    private function cacheCheck(): bool
    {
        try {
            Cache::put('health_ping', true, 10);

            return Cache::get('health_ping') === true;
        } catch (Throwable) {
            return false;
        }
    }

    private function queueCheck(): bool
    {
        try {
            Queue::connection();

            return true;
        } catch (Throwable) {
            return false;
        }
    }
}
