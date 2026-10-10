<?php

namespace App\Services\Payments;

use App\Contracts\Payments\PaymentProvider;
use App\Exceptions\ApiException;
use App\Models\Payment;
use App\Models\PaymentRefund;
use App\Models\User;

class DisabledPaymentProvider implements PaymentProvider
{
    public function createIntent(Payment $payment, array $context = []): array
    {
        throw new ApiException(
            'PAYMENTS_DISABLED',
            'Online payment is not enabled. Use reserve now and pay later.',
            503,
        );
    }

    public function parseWebhook(string $payload, ?string $signature): array
    {
        throw new ApiException(
            'PAYMENTS_DISABLED',
            'No payment provider is configured.',
            503,
        );
    }

    public function refund(Payment $payment, int $amountMinor, ?string $reason = null, ?User $actor = null): PaymentRefund
    {
        throw new ApiException(
            'PAYMENTS_DISABLED',
            'Online payment refunds are not enabled.',
            503,
        );
    }

    public function name(): string
    {
        return 'disabled';
    }
}
