<?php

namespace App\Contracts\Payments;

use App\Models\Payment;

interface PaymentProvider
{
    /**
     * @param  array<string, mixed>  $context
     * @return array<string, mixed>
     */
    public function createIntent(Payment $payment, array $context = []): array;

    /**
     * Validate and normalize an incoming provider webhook.
     *
     * @return array{
     *   eventId:string,
     *   providerReference:?string,
     *   status:string,
     *   payload:array<string,mixed>
     * }
     */
    public function parseWebhook(string $payload, ?string $signature): array;

    public function name(): string;
}
