<?php

namespace App\Support;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApiResponse
{
    /**
     * @param  array<string, mixed>  $meta
     */
    public static function success(
        Request $request,
        mixed $data,
        array $meta = [],
        int $status = 200,
    ): JsonResponse {
        return response()->json([
            'data' => $data,
            'meta' => (object) $meta,
            'requestId' => self::requestId($request),
        ], $status);
    }

    /**
     * @param  array<string, mixed>  $details
     */
    public static function error(
        Request $request,
        string $code,
        string $message,
        int $status,
        array $details = [],
    ): JsonResponse {
        $catalogEntry = config("api_errors.{$code}");

        return response()->json([
            'error' => [
                'code' => $code,
                'message' => $message,
                'details' => (object) $details,
                'catalog' => $catalogEntry ? [
                    'category' => $catalogEntry['category'],
                    'retryable' => $catalogEntry['retryable'],
                    'messageEn' => $catalogEntry['messageEn'],
                    'messageAr' => $catalogEntry['messageAr'],
                ] : null,
                'requestId' => self::requestId($request),
            ],
        ], $status);
    }

    private static function requestId(Request $request): string
    {
        return (string) ($request->attributes->get('request_id') ?? '');
    }
}
