<?php

return [
    'version' => '2026-07-24',
    'max_active_sessions_per_user' => (int) env('MAX_ACTIVE_SESSIONS_PER_USER', 8),
    'allow_same_installation_replacement' => true,
    'installation_id' => [
        'source' => 'application_generated',
        'storage' => 'secure_storage',
        'min_length' => 8,
        'max_length' => 120,
    ],
    'allowed_platforms' => ['web', 'android', 'ios'],
    'disallowed_practices' => [
        'hardware_fingerprinting',
        'advertising_id_as_primary_identifier',
        'imei_or_serial_collection',
    ],
    'session_revocation' => [
        'revokes_access_token' => true,
        'revokes_refresh_token' => true,
        'revokes_push_tokens_for_session' => true,
        'purges_user_scoped_offline_cache' => true,
    ],
];
