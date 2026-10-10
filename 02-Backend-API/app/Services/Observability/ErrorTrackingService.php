<?php

namespace App\Services\Observability;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class ErrorTrackingService
{
    protected static ?array $lastCapturedEvent = null;

    /**
     * @param  array<string, mixed>  $customContext
     */
    public function captureException(Throwable $exception, array $customContext = [], ?Request $request = null): ?string
    {
        $eventId = (string) Str::uuid();

        $context = $this->buildContext($customContext, $request);
        $sanitizedContext = $this->sanitize($context);

        $event = [
            'event_id' => $eventId,
            'timestamp' => now()->toIso8601String(),
            'environment' => config('sentry.environment', app()->environment()),
            'release' => config('sentry.release', 'ain-api@1.0.0'),
            'level' => 'error',
            'exception' => [
                'class' => get_class($exception),
                'message' => $exception->getMessage(),
                'code' => $exception->getCode(),
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
            ],
            'context' => $sanitizedContext,
        ];

        self::$lastCapturedEvent = $event;

        $dsn = config('sentry.dsn');
        if ($dsn) {
            // Forward to Sentry transport / log channel
            Log::channel('single')->error("[Sentry:{$eventId}] {$exception->getMessage()}", $sanitizedContext);
        } else {
            Log::channel('single')->error("[ErrorTracker:{$eventId}] {$exception->getMessage()}", $sanitizedContext);
        }

        return $eventId;
    }

    /**
     * @param  array<string, mixed>  $context
     */
    public function captureMessage(string $message, string $level = 'info', array $context = []): ?string
    {
        $eventId = (string) Str::uuid();
        $sanitizedContext = $this->sanitize($context);

        $event = [
            'event_id' => $eventId,
            'timestamp' => now()->toIso8601String(),
            'level' => $level,
            'message' => $message,
            'context' => $sanitizedContext,
        ];

        self::$lastCapturedEvent = $event;
        Log::channel('single')->log($level, "[ErrorTracker:{$eventId}] {$message}", $sanitizedContext);

        return $eventId;
    }

    public function sanitize(mixed $data): mixed
    {
        if (is_null($data) || is_scalar($data)) {
            if (is_string($data)) {
                return $this->sanitizeString($data);
            }

            return $data;
        }

        if (is_array($data)) {
            $sensitiveKeys = config('sentry.sensitive_keys', [
                'password', 'token', 'secret', 'authorization', 'cookie', 'cvv', 'otp', 'code',
            ]);

            $sanitized = [];
            foreach ($data as $key => $value) {
                $lowerKey = mb_strtolower((string) $key);
                $isSensitive = false;

                foreach ($sensitiveKeys as $pattern) {
                    if (str_contains($lowerKey, $pattern)) {
                        $isSensitive = true;
                        break;
                    }
                }

                if ($isSensitive) {
                    $sanitized[$key] = '[REDACTED]';
                } else {
                    $sanitized[$key] = $this->sanitize($value);
                }
            }

            return $sanitized;
        }

        if (is_object($data)) {
            return $this->sanitize((array) $data);
        }

        return $data;
    }

    protected function sanitizeString(string $value): string
    {
        // Redact Bearer tokens in headers or strings
        $value = preg_replace('/Bearer\s+[a-zA-Z0-9_\-\.]+/i', 'Bearer [REDACTED]', $value);

        // Redact suspected 16-digit credit card numbers
        $value = preg_replace('/\b(?:\d{4}[-\s]?){3}\d{4}\b/', '[REDACTED_CARD]', $value);

        // Redact standard EICAR test string if present in error message
        if (str_contains($value, 'EICAR-STANDARD-ANTIVIRUS-TEST-FILE')) {
            $value = str_replace('EICAR-STANDARD-ANTIVIRUS-TEST-FILE', '[REDACTED_EICAR_SIG]', $value);
        }

        return $value;
    }

    protected function buildContext(array $customContext, ?Request $request): array
    {
        $context = $customContext;

        if ($request) {
            $context['http'] = [
                'method' => $request->method(),
                'url' => $request->fullUrl(),
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'headers' => $request->headers->all(),
                'payload' => $request->except(['password', 'password_confirmation', 'token']),
            ];

            if ($user = $request->user()) {
                $context['user'] = [
                    'id' => $user->id,
                    'role' => $user->platform_role ?? 'user',
                ];
            }
        }

        return $context;
    }

    public static function getLastCapturedEvent(): ?array
    {
        return self::$lastCapturedEvent;
    }

    public static function resetLastCapturedEvent(): void
    {
        self::$lastCapturedEvent = null;
    }
}
