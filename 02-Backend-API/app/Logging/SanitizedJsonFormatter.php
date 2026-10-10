<?php

namespace App\Logging;

use Monolog\Formatter\JsonFormatter;
use Monolog\LogRecord;

class SanitizedJsonFormatter extends JsonFormatter
{
    protected array $sensitiveKeys = [
        'password',
        'password_confirmation',
        'current_password',
        'token',
        'access_token',
        'refresh_token',
        'authorization',
        'bearer',
        'cookie',
        'set-cookie',
        'secret',
        'api_key',
        'app_key',
        'client_secret',
        'card_number',
        'credit_card',
        'cvv',
        'cvc',
        'otp',
        'code',
        'mfa_code',
        'national_id',
    ];

    public function format(LogRecord $record): string
    {
        $sanitizedContext = $this->sanitizeData($record->context);
        $sanitizedExtra = $this->sanitizeData($record->extra);

        $normalized = [
            'timestamp' => $record->datetime->format('c'),
            'level' => $record->level->getName(),
            'channel' => $record->channel,
            'message' => $this->sanitizeString($record->message),
            'context' => $sanitizedContext,
            'extra' => $sanitizedExtra,
        ];

        return $this->toJson($normalized, true).($this->appendNewline ? "\n" : '');
    }

    protected function sanitizeData(mixed $data): mixed
    {
        if (is_null($data) || is_scalar($data)) {
            if (is_string($data)) {
                return $this->sanitizeString($data);
            }

            return $data;
        }

        if (is_array($data)) {
            $cleaned = [];
            foreach ($data as $key => $value) {
                $lower = mb_strtolower((string) $key);
                $isSecret = false;

                foreach ($this->sensitiveKeys as $pattern) {
                    if (str_contains($lower, $pattern)) {
                        $isSecret = true;
                        break;
                    }
                }

                if ($isSecret) {
                    $cleaned[$key] = '[REDACTED]';
                } else {
                    $cleaned[$key] = $this->sanitizeData($value);
                }
            }

            return $cleaned;
        }

        return $data;
    }

    protected function sanitizeString(string $value): string
    {
        // Redact Authorization Bearer tokens in log message
        $value = preg_replace('/Bearer\s+[a-zA-Z0-9_\-\.]+/i', 'Bearer [REDACTED]', $value);

        // Redact suspected credit card numbers
        $value = preg_replace('/\b(?:\d{4}[-\s]?){3}\d{4}\b/', '[REDACTED_CARD]', $value);

        return $value;
    }
}
