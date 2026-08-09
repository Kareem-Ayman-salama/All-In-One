<?php

return [
    'provider' => env('PUSH_PROVIDER', 'disabled'),
    'queue' => env('PUSH_QUEUE', 'notifications'),
    'max_tokens_per_job' => (int) env('PUSH_MAX_TOKENS_PER_JOB', 100),
    'fcm' => [
        'project_id' => env('FCM_PROJECT_ID'),
        'service_account_json_base64' => env('FCM_SERVICE_ACCOUNT_JSON_BASE64'),
        'service_account_path' => env('FCM_SERVICE_ACCOUNT_PATH'),
        'token_uri' => env('FCM_TOKEN_URI', 'https://oauth2.googleapis.com/token'),
    ],
];
