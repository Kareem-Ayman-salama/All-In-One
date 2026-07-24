<?php

return [
    'access_token_minutes' => (int) env('ACCESS_TOKEN_TTL_MINUTES', 15),
    'refresh_token_days' => (int) env('REFRESH_TOKEN_TTL_DAYS', 30),
    'refresh_cookie' => env('REFRESH_TOKEN_COOKIE', 'aio_refresh_token'),
    'cookie_secure' => (bool) env('COOKIE_SECURE', false),
    'cookie_same_site' => env('COOKIE_SAME_SITE', 'lax'),
    'frontend_url' => env('FRONTEND_URL', 'http://localhost:5173'),
    'redis_required' => (bool) env('REDIS_REQUIRED', false),
];
