<?php

namespace App\Contracts\Notifications;

interface PushNotificationProvider
{
    /**
     * @param  list<string>  $tokens
     * @param  array<string, mixed>  $payload
     * @return array{sent:int,failed:int,skipped:bool}
     */
    public function send(array $tokens, array $payload): array;
}
