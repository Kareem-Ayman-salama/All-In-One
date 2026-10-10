<?php

namespace App\Services\Payments;

use App\Models\Payment;
use App\Models\PaymentRefund;
use App\Models\PaymentWebhookEvent;
use App\Services\Bookings\BookingService;
use Carbon\Carbon;

class FinancialReconciliationService
{
    public function __construct(
        protected BookingService $bookingService,
    ) {}

    /**
     * Run financial and operational reconciliation across payments, refunds, webhooks, and bookings.
     *
     * @return array<string, mixed>
     */
    public function reconcile(
        ?Carbon $from = null,
        ?Carbon $to = null,
        ?string $organizationId = null,
        bool $autoFix = false,
    ): array {
        $from = $from ?: now()->subDays(30)->startOfDay();
        $to = $to ?: now()->endOfDay();

        // 1. Payments Query
        $paymentsQuery = Payment::query()
            ->whereBetween('created_at', [$from, $to]);

        if ($organizationId) {
            $paymentsQuery->where('organization_id', $organizationId);
        }

        $payments = $paymentsQuery->with('booking')->get();

        // 2. Refunds Query
        $refundsQuery = PaymentRefund::query()
            ->whereBetween('created_at', [$from, $to]);

        if ($organizationId) {
            $refundsQuery->where('organization_id', $organizationId);
        }

        $refunds = $refundsQuery->get();

        // 3. Webhooks Query
        $webhooksQuery = PaymentWebhookEvent::query()
            ->whereBetween('created_at', [$from, $to]);

        $webhooks = $webhooksQuery->get();

        // 4. Calculate Summaries
        $totalPaymentsCount = $payments->count();
        $paidPayments = $payments->filter(fn (Payment $p) => in_array($p->status, ['paid', 'partially_refunded', 'refunded'], true));
        $fullyPaidPayments = $payments->where('status', 'paid');
        $pendingPayments = $payments->where('status', 'pending');
        $failedPayments = $payments->where('status', 'failed');
        $refundedPayments = $payments->where('status', 'refunded');
        $partiallyRefundedPayments = $payments->where('status', 'partially_refunded');

        $grossVolumeMinor = (int) $paidPayments->sum('amount_minor');
        $refundedVolumeMinor = (int) $payments->sum('refunded_amount_minor');
        $feeVolumeMinor = (int) $paidPayments->sum('fee_minor');
        $netVolumeMinor = max(0, $grossVolumeMinor - $refundedVolumeMinor - $feeVolumeMinor);

        // Currencies breakdown
        $currencies = [];
        foreach ($payments->groupBy('currency') as $currency => $currPayments) {
            $currPaid = $currPayments->filter(fn (Payment $p) => in_array($p->status, ['paid', 'partially_refunded', 'refunded'], true));
            $currGross = (int) $currPaid->sum('amount_minor');
            $currRefunded = (int) $currPayments->sum('refunded_amount_minor');
            $currFees = (int) $currPaid->sum('fee_minor');
            $currNet = max(0, $currGross - $currRefunded - $currFees);

            $currencies[$currency] = [
                'count' => $currPayments->count(),
                'gross_minor' => $currGross,
                'refunded_minor' => $currRefunded,
                'fees_minor' => $currFees,
                'net_minor' => $currNet,
            ];
        }

        // Webhooks stats
        $webhookStats = [
            'total' => $webhooks->count(),
            'processed' => $webhooks->where('status', 'processed')->count(),
            'received' => $webhooks->where('status', 'received')->count(),
            'failed' => $webhooks->where('status', 'failed')->count(),
        ];

        // 5. Discrepancy Auditing
        $discrepancies = [];
        $fixesApplied = [];

        foreach ($payments as $payment) {
            // A. Check: UNCONFIRMED_PAID_BOOKINGS
            if (in_array($payment->status, ['paid', 'partially_refunded'], true) && $payment->booking_id) {
                $booking = $payment->booking;
                if ($booking && $booking->status->value !== 'confirmed') {
                    $discrepancy = [
                        'type' => 'UNCONFIRMED_PAID_BOOKING',
                        'severity' => 'CRITICAL',
                        'payment_id' => $payment->id,
                        'booking_id' => $booking->id,
                        'amount_minor' => $payment->amount_minor,
                        'payment_status' => $payment->status,
                        'booking_status' => $booking->status->value ?? (string) $booking->status,
                        'message' => "Payment {$payment->id} is paid but Booking {$booking->id} is in status {$booking->status->value}.",
                    ];

                    if ($autoFix) {
                        try {
                            $this->bookingService->confirm(
                                booking: $booking,
                                actor: null,
                                markAsPaid: true,
                                internalNote: "Auto-reconciled: Payment {$payment->id} is verified paid.",
                            );
                            $discrepancy['auto_fixed'] = true;
                            $fixesApplied[] = "Confirmed booking {$booking->id} for paid payment {$payment->id}.";
                        } catch (\Throwable $e) {
                            $discrepancy['auto_fixed'] = false;
                            $discrepancy['fix_error'] = $e->getMessage();
                        }
                    }

                    $discrepancies[] = $discrepancy;
                }
            }

            // B. Check: AMOUNT_MISMATCH
            if ($payment->booking_id && $payment->booking) {
                if ((int) $payment->amount_minor !== (int) $payment->booking->amount_minor) {
                    $discrepancies[] = [
                        'type' => 'AMOUNT_MISMATCH',
                        'severity' => 'CRITICAL',
                        'payment_id' => $payment->id,
                        'booking_id' => $payment->booking->id,
                        'payment_amount_minor' => $payment->amount_minor,
                        'booking_amount_minor' => $payment->booking->amount_minor,
                        'message' => "Payment amount ({$payment->amount_minor}) differs from booking amount ({$payment->booking->amount_minor}).",
                    ];
                }
            }

            // C. Check: STALE_PENDING_PAYMENTS
            if ($payment->status === 'pending' && $payment->created_at->lt(now()->subHours(2))) {
                $discrepancies[] = [
                    'type' => 'STALE_PENDING_PAYMENT',
                    'severity' => 'MEDIUM',
                    'payment_id' => $payment->id,
                    'created_at' => $payment->created_at->toIso8601String(),
                    'message' => "Payment {$payment->id} has been pending for over 2 hours without resolution.",
                ];
            }
        }

        // D. Check: UNMATCHED_WEBHOOKS
        foreach ($webhooks as $webhook) {
            if ($webhook->status === 'received' && $webhook->created_at->lt(now()->subMinutes(30))) {
                $discrepancies[] = [
                    'type' => 'UNPROCESSED_WEBHOOK',
                    'severity' => 'HIGH',
                    'webhook_event_id' => $webhook->id,
                    'provider_event_id' => $webhook->provider_event_id,
                    'created_at' => $webhook->created_at->toIso8601String(),
                    'message' => "Webhook {$webhook->provider_event_id} has been in received state for over 30 minutes.",
                ];
            }
        }

        // Determine Overall Health Status
        $hasCritical = collect($discrepancies)->where('severity', 'CRITICAL')->where('auto_fixed', '!==', true)->isNotEmpty();
        $hasHigh = collect($discrepancies)->where('severity', 'HIGH')->isNotEmpty();

        $healthStatus = 'healthy';
        if ($hasCritical) {
            $healthStatus = 'critical';
        } elseif ($hasHigh || collect($discrepancies)->isNotEmpty()) {
            $healthStatus = 'warning';
        }

        return [
            'reconciliation_time' => now()->toIso8601String(),
            'period' => [
                'from' => $from->toIso8601String(),
                'to' => $to->toIso8601String(),
            ],
            'organization_id' => $organizationId,
            'health_status' => $healthStatus,
            'summary' => [
                'total_payments_count' => $totalPaymentsCount,
                'paid_count' => $fullyPaidPayments->count(),
                'pending_count' => $pendingPayments->count(),
                'failed_count' => $failedPayments->count(),
                'refunded_count' => $refundedPayments->count(),
                'partially_refunded_count' => $partiallyRefundedPayments->count(),
                'gross_volume_minor' => $grossVolumeMinor,
                'refunded_volume_minor' => $refundedVolumeMinor,
                'fee_volume_minor' => $feeVolumeMinor,
                'net_volume_minor' => $netVolumeMinor,
                'currencies' => $currencies,
            ],
            'refunds' => [
                'total_count' => $refunds->count(),
                'succeeded_count' => $refunds->where('status', 'succeeded')->count(),
                'total_amount_minor' => (int) $refunds->where('status', 'succeeded')->sum('amount_minor'),
            ],
            'webhooks' => $webhookStats,
            'discrepancies' => $discrepancies,
            'fixes_applied' => $fixesApplied,
        ];
    }
}
