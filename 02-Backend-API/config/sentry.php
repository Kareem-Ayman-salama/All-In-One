<?php

return [
    'dsn' => env('SENTRY_LARAVEL_DSN', env('SENTRY_DSN')),

    // The release version of the application
    'release' => env('SENTRY_RELEASE', 'ain-api@1.0.0'),

    // The current environment
    'environment' => env('SENTRY_ENVIRONMENT', env('APP_ENV', 'staging')),

    // Sample rate for error events (1.0 = 100%)
    'sample_rate' => (float) env('SENTRY_SAMPLE_RATE', 1.0),

    // Sample rate for performance transactions
    'traces_sample_rate' => (float) env('SENTRY_TRACES_SAMPLE_RATE', 0.2),

    // Enable/disable sending default PII
    'send_default_pii' => false,

    // Sensitive field keys that must ALWAYS be redacted from error contexts
    'sensitive_keys' => [
        'password',
        'password_confirmation',
        'current_password',
        'token',
        'access_token',
        'refresh_token',
        'authorization',
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
        'phone',
        'date_of_birth',
        'national_id',
        'guardian_email',
        'eicar',
    ],
];
