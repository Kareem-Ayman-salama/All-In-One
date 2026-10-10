<?php

namespace App\Services\Notifications;

use App\Contracts\Notifications\PushNotificationProvider;
use Illuminate\Support\Facades\Log;

class DisabledPushNotificationProvider implements PushNotificationProvider
{
    /**
     * @param  list<string>  $tokens
     * @param  array<string, mixed>  $payload
     * @return array{sent:int,failed:int,skipped:bool}
     */
    public function send(array $tokens, array $payload): array
    {
        Log::info('aio.push.skipped', [
            'reason' => 'provider_disabled',
            'tokenCount' => count($tokens),
            'notificationId' => $payload['data']['notificationId'] ?? null,
            'type' => $payload['data']['type'] ?? null,
        ]);

        return [
            'sent' => 0,
            'failed' => 0,
            'skipped' => true,
        ];
    }
}
