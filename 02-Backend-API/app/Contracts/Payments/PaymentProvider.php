<?php

namespace App\Contracts\Payments;

use App\Models\Payment;
use App\Models\PaymentRefund;
use App\Models\User;

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

    /**
     * Process a refund for a payment.
     */
    public function refund(Payment $payment, int $amountMinor, ?string $reason = null, ?User $actor = null): PaymentRefund;

    public function name(): string;
}
