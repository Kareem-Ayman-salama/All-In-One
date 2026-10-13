<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Content Download Policy
    |--------------------------------------------------------------------------
    |
    | Keep course files view-only by default. Enabling downloads is an explicit
    | deployment decision and never trusts a client-supplied upload flag alone.
    |
    */
    'downloads_enabled' => env('CONTENT_DOWNLOADS_ENABLED', false),
];
