<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Throwable;

class HealthController extends Controller
{
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
}
