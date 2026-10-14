<?php

namespace App\Services\Billing;

use App\Models\Booking;
use App\Models\Invoice;
use App\Models\Payment;

class InvoiceService
{
    /**
     * Create the pending invoice associated with a payment.
     */
    public function issuePending(Payment $payment, Booking $booking): ?Invoice
    {
        if (! $payment->user_id) {
            return null;
        }

        $courseTitle = $booking->course()->value('title') ?: 'Course enrollment';
        $invoice = Invoice::query()->firstOrCreate(
            ['payment_id' => $payment->id],
            [
                'organization_id' => $payment->organization_id,
                'user_id' => $payment->user_id,
                'invoice_number' => $this->invoiceNumber($payment),
                'subtotal_minor' => $payment->amount_minor,
                'tax_minor' => 0,
                'total_minor' => $payment->amount_minor,
                'currency' => $payment->currency,
                'status' => 'pending',
                'issued_at' => now(),
                'due_at' => now()->addHours(24),
                'items_breakdown' => [[
                    'description' => $courseTitle,
                    'amount_minor' => $payment->amount_minor,
                    'booking_id' => $booking->id,
                    'course_id' => $booking->course_id,
                ]],
            ],
        );

        if ($invoice->status !== 'paid') {
            $invoice->update([
                'status' => 'pending',
                'due_at' => $invoice->due_at ?: now()->addHours(24),
            ]);
        }

        return $invoice->fresh();
    }

    /**
     * Mark the payment invoice as paid after a verified gateway callback.
     */
    public function markPaid(Payment $payment): ?Invoice
    {
        $invoice = Invoice::query()->where('payment_id', $payment->id)->first();
        if (! $invoice && $payment->booking_id) {
            $booking = Booking::query()->find($payment->booking_id);
            if ($booking) {
                $invoice = $this->issuePending($payment, $booking);
            }
        }

        if (! $invoice) {
            return null;
        }

        $invoice->update([
            'status' => 'paid',
            'paid_at' => $payment->paid_at ?: now(),
        ]);

        return $invoice->fresh();
    }

    /**
     * Build a stable, user-facing invoice number.
     */
    private function invoiceNumber(Payment $payment): string
    {
        return sprintf(
            'AIN-%s-%s',
            now()->format('Y'),
            strtoupper(substr(str_replace('-', '', $payment->id), 0, 12)),
        );
    }
}
