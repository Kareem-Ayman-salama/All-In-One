<?php

return [
    'provider' => env('PUSH_PROVIDER', 'disabled'),
    'queue' => env('PUSH_QUEUE', 'notifications'),
    'max_tokens_per_job' => (int) env('PUSH_MAX_TOKENS_PER_JOB', 100),
];
