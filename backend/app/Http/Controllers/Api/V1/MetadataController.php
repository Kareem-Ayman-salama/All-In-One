<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MetadataController extends Controller
{
    public function errorCatalog(Request $request): JsonResponse
    {
        return ApiResponse::success($request, [
            'version' => '2026-07-24',
            'errors' => config('api_errors', []),
        ]);
    }

    public function deepLinks(Request $request): JsonResponse
    {
        $frontendUrl = rtrim((string) config('aio.frontend_url'), '/');

        return ApiResponse::success($request, [
            'version' => config('deep_links.version'),
            'scheme' => config('deep_links.scheme'),
            'webHost' => config('deep_links.web_host'),
            'baseUrl' => $frontendUrl,
            'routes' => collect(config('deep_links.routes', []))
                ->map(fn (array $route): array => [
                    ...$route,
                    'webUrlTemplate' => $frontendUrl.$route['path'],
                    'appUrlTemplate' => config('deep_links.scheme').'://'
                        .ltrim($route['path'], '/'),
                ])
                ->all(),
        ]);
    }

    public function offlineCachePolicy(Request $request): JsonResponse
    {
        return ApiResponse::success($request, config('offline_cache', []));
    }

    public function devicePolicy(Request $request): JsonResponse
    {
        return ApiResponse::success($request, config('device_policy', []));
    }
}
