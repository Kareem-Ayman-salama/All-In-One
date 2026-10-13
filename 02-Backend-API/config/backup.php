<?php

return [
    /*
    | Production backups must live outside the application container because
    | Railway container storage is ephemeral. Local remains suitable for tests
    | and developer machines; production readiness requires an S3-compatible
    | disk explicitly.
    */
    'disk' => env('BACKUP_DISK', 'local'),
];
