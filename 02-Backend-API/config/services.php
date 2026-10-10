<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'paymob' => [
        'api_key' => env('PAYMOB_API_KEY', ''),
        'integration_id' => env('PAYMOB_INTEGRATION_ID', ''),
        'iframe_id' => env('PAYMOB_IFRAME_ID', ''),
        'hmac_secret' => env('PAYMOB_HMAC_SECRET', ''),
        'currency' => env('PAYMOB_CURRENCY', 'EGP'),
        'base_url' => env('PAYMOB_BASE_URL', 'https://accept.paymob.com/api'),
        'sandbox_mode' => (bool) env('PAYMOB_SANDBOX_MODE', false),
        'allow_simulation' => (bool) env('PAYMOB_ALLOW_SIMULATION', false),
        'fee_percent' => (float) env('PAYMOB_FEE_PERCENT', 2.75),
        'fee_fixed_minor' => (int) env('PAYMOB_FEE_FIXED_MINOR', 300),
    ],

];
