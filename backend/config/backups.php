<?php

return [
    'enabled' => filter_var(env('BACKUP_ENABLED', false), FILTER_VALIDATE_BOOL),
    'disk' => env('BACKUP_DISK', 's3'),
    'retention_days' => (int) env('BACKUP_RETENTION_DAYS', 14),
];
