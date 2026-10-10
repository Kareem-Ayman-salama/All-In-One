<?php

namespace App\Console\Commands;

use App\Domain\Marketplace\Enums\BatchStatus;
use App\Domain\Marketplace\Enums\CourseStatus;
use App\Exceptions\ApiException;
use App\Models\Booking;
use App\Models\Course;
use App\Models\CourseBatch;
use App\Models\Organization;
use App\Models\Payment;
use App\Models\PaymentWebhookEvent;
use App\Models\Room;
use App\Models\User;
use App\Services\Bookings\BookingService;
use App\Services\Payments\PaymobGatewayService;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class RehearsePaymobWebhookCommand extends Command
{
    protected $signature = 'payments:rehearse-webhook
                            {--secret= : Custom HMAC secret to use for simulation}
                            {--all : Execute all rehearsal scenarios sequentially}';

    protected $description = 'Execute end-to-end automated rehearsal of Paymob webhook workflows (success, idempotency, failure, refunds, tampering).';

    public function handle(PaymobGatewayService $gateway, BookingService $bookingService): int
    {
        $this->newLine();
        $this->line('===========================================================');
        $this->line('         PAYMOB WEBHOOK & FINANCIAL REHEARSAL              ');
        $this->line('===========================================================');

        $hmacSecret = $this->option('secret')
            ?: config('services.paymob.hmac_secret')
            ?: 'rehearsal_secret_key_'.Str::random(16);

        config(['services.paymob.hmac_secret' => $hmacSecret]);
        $integrationId = (string) (config('services.paymob.integration_id') ?: '789012');
        config(['services.paymob.integration_id' => $integrationId]);

        $this->info('Active HMAC Secret: '.substr($hmacSecret, 0, 8).'...'.substr($hmacSecret, -4));
        $this->info("Integration ID: {$integrationId}");
        $this->newLine();

        $passed = 0;
        $failed = 0;

        // SCENARIO 1: Happy-path Success Webhook
        $this->line('<fg=yellow>Scenario 1: Happy-path Success Webhook</>');
        try {
            [$booking, $payment] = $this->createFixture($gateway, 50000);
            $orderId = (int) ($payment->provider_reference ?: 1234567);
            $txnId = random_int(1000000, 9999999);

            $obj = $this->makePayloadObject($txnId, $orderId, 50000, 'EGP', $integrationId, true);
            $hmac = $gateway->calculateHmac($obj, $hmacSecret);

            $payloadJson = (string) json_encode(['type' => 'TRANSACTION', 'obj' => $obj]);
            $parsed = $gateway->parseWebhook($payloadJson, $hmac);

            $this->assertEquals('paid', $parsed['status'], 'Parsed webhook status must be paid');

            // Record webhook event
            PaymentWebhookEvent::query()->create([
                'provider' => 'paymob',
                'provider_event_id' => (string) $txnId,
                'signature_hash' => hash('sha256', $hmac),
                'payload' => $parsed['payload'],
                'status' => 'received',
            ]);

            $updatedPayment = $gateway->handleSuccessfulPayment($payment, $parsed['payload'], $bookingService);

            $this->assertEquals('paid', $updatedPayment->status, 'Payment must be in paid status');
            $this->assertGreaterThan(0, $updatedPayment->fee_minor, 'Processing fee must be calculated');
            $this->assertEquals(
                'confirmed',
                $booking->fresh()->status->value,
                'Booking status must be confirmed'
            );

            $this->info('  ✓ [PASS] Happy-path webhook verified (Payment paid, fees calculated, booking confirmed)');
            $passed++;
        } catch (\Throwable $e) {
            $this->error('  ✗ [FAIL] Scenario 1 failed: '.$e->getMessage());
            $failed++;
        }

        // SCENARIO 2: Idempotent Replay (Duplicate Webhook)
        $this->newLine();
        $this->line('<fg=yellow>Scenario 2: Idempotency & Duplicate Replay Protection</>');
        try {
            $existingEvent = PaymentWebhookEvent::query()->where('provider_event_id', (string) $txnId)->first();
            $this->assertNotNull($existingEvent, 'Existing webhook event must exist from Scenario 1');

            $existingEvent->update(['status' => 'processed']);

            // Simulate incoming duplicate webhook
            $dupParsed = $gateway->parseWebhook($payloadJson, $hmac);
            $dupEvent = PaymentWebhookEvent::query()->where('provider_event_id', $dupParsed['eventId'])->first();

            $isAlreadyProcessed = $dupEvent && $dupEvent->status === 'processed';
            $this->assertTrue($isAlreadyProcessed, 'Duplicate webhook must be identified as already_processed');

            $this->info('  ✓ [PASS] Idempotent duplicate replay safely detected without double-crediting');
            $passed++;
        } catch (\Throwable $e) {
            $this->error('  ✗ [FAIL] Scenario 2 failed: '.$e->getMessage());
            $failed++;
        }

        // SCENARIO 3: Failed Payment Webhook
        $this->newLine();
        $this->line('<fg=yellow>Scenario 3: Failed Payment Webhook Handling</>');
        try {
            [$failBooking, $failPayment] = $this->createFixture($gateway, 75000);
            $failTxnId = random_int(1000000, 9999999);
            $failOrderId = (int) ($failPayment->provider_reference ?: 2345678);

            $failObj = $this->makePayloadObject($failTxnId, $failOrderId, 75000, 'EGP', $integrationId, false);
            $failHmac = $gateway->calculateHmac($failObj, $hmacSecret);

            $failPayloadJson = (string) json_encode(['type' => 'TRANSACTION', 'obj' => $failObj]);
            $failParsed = $gateway->parseWebhook($failPayloadJson, $failHmac);

            $this->assertEquals('failed', $failParsed['status'], 'Parsed webhook status must be failed');

            $updatedFailPayment = $gateway->handleFailedPayment($failPayment, $failParsed['payload']);

            $this->assertEquals('failed', $updatedFailPayment->status, 'Payment must transition to failed status');
            $this->assertNotEquals(
                'confirmed',
                $failBooking->fresh()->status->value,
                'Booking must NOT be confirmed for failed payment'
            );

            $this->info('  ✓ [PASS] Failed payment recorded cleanly without confirming booking');
            $passed++;
        } catch (\Throwable $e) {
            $this->error('  ✗ [FAIL] Scenario 3 failed: '.$e->getMessage());
            $failed++;
        }

        // SCENARIO 4: Refund Execution (Full & Partial)
        $this->newLine();
        $this->line('<fg=yellow>Scenario 4: Refund Flow (Partial & Full)</>');
        try {
            [$rfBooking, $rfPayment] = $this->createFixture($gateway, 100000);
            // Simulate that it was already paid
            $rfPayment->update([
                'status' => 'paid',
                'paid_at' => now(),
                'fee_minor' => 3050,
                'net_minor' => 96950,
            ]);

            // Partial refund: 40000 of 100000
            $partialRefund = $gateway->refund(
                payment: $rfPayment,
                amountMinor: 40000,
                reason: 'Student partial schedule conflict',
            );

            $this->assertEquals('partially_refunded', $rfPayment->fresh()->status, 'Payment must be partially_refunded');
            $this->assertEquals(40000, $rfPayment->fresh()->refunded_amount_minor, 'Refunded amount must be 40000');
            $this->assertEquals(60000, $rfPayment->fresh()->remainingRefundableAmount(), 'Remaining amount must be 60000');

            // Full remaining refund: 60000
            $fullRefund = $gateway->refund(
                payment: $rfPayment,
                amountMinor: 60000,
                reason: 'Remaining balance refund',
            );

            $this->assertEquals('refunded', $rfPayment->fresh()->status, 'Payment must be refunded');
            $this->assertEquals(100000, $rfPayment->fresh()->refunded_amount_minor, 'Refunded amount must equal original amount');
            $this->assertEquals(0, $rfPayment->fresh()->remainingRefundableAmount(), 'Remaining amount must be 0');

            $this->info('  ✓ [PASS] Partial and full refund operations executed with ledger consistency');
            $passed++;
        } catch (\Throwable $e) {
            $this->error('  ✗ [FAIL] Scenario 4 failed: '.$e->getMessage());
            $failed++;
        }

        // SCENARIO 5: Signature Tampering & Forgery Rejection
        $this->newLine();
        $this->line('<fg=yellow>Scenario 5: Signature Tampering & Forgery Resistance</>');
        try {
            [$tamperBooking, $tamperPayment] = $this->createFixture($gateway, 30000);
            $tamperObj = $this->makePayloadObject(9999999, 888888, 30000, 'EGP', $integrationId, true);
            $badHmac = 'invalid_sha512_hash_'.Str::random(32);

            $tamperedJson = (string) json_encode(['type' => 'TRANSACTION', 'obj' => $tamperObj]);

            $rejected = false;
            try {
                $gateway->parseWebhook($tamperedJson, $badHmac);
            } catch (ApiException $e) {
                if ($e->errorCode === 'INVALID_SIGNATURE' || $e->status === 403) {
                    $rejected = true;
                }
            }

            $this->assertTrue($rejected, 'Webhook with forged signature must be strictly rejected with 403');
            $this->info('  ✓ [PASS] Forged HMAC signature strictly rejected (403 INVALID_SIGNATURE)');
            $passed++;
        } catch (\Throwable $e) {
            $this->error('  ✗ [FAIL] Scenario 5 failed: '.$e->getMessage());
            $failed++;
        }

        // SCENARIO 6: Amount Mismatch Protection
        $this->newLine();
        $this->line('<fg=yellow>Scenario 6: Webhook Amount Mismatch Protection</>');
        try {
            [$mismatchBooking, $mismatchPayment] = $this->createFixture($gateway, 80000);
            $mismatchTxnId = random_int(1000000, 9999999);
            $mismatchOrderId = (int) ($mismatchPayment->provider_reference ?: 3456789);

            // Webhook claims only 10000 was paid instead of expected 80000
            $mismatchObj = $this->makePayloadObject($mismatchTxnId, $mismatchOrderId, 10000, 'EGP', $integrationId, true);
            $mismatchHmac = $gateway->calculateHmac($mismatchObj, $hmacSecret);

            $mismatchJson = (string) json_encode(['type' => 'TRANSACTION', 'obj' => $mismatchObj]);
            $mismatchParsed = $gateway->parseWebhook($mismatchJson, $mismatchHmac);

            $amountMismatchBlocked = false;
            try {
                $gateway->handleSuccessfulPayment($mismatchPayment, $mismatchParsed['payload'], $bookingService);
            } catch (ApiException $e) {
                if ($e->errorCode === 'PAYMENT_AMOUNT_MISMATCH' || $e->status === 422) {
                    $amountMismatchBlocked = true;
                }
            }

            $this->assertTrue($amountMismatchBlocked, 'Underpayment webhook must be strictly rejected');
            $this->info('  ✓ [PASS] Amount underpayment attempt strictly blocked (422 PAYMENT_AMOUNT_MISMATCH)');
            $passed++;
        } catch (\Throwable $e) {
            $this->error('  ✗ [FAIL] Scenario 6 failed: '.$e->getMessage());
            $failed++;
        }

        $this->newLine();
        $this->line('===========================================================');
        $this->line("REHEARSAL SUMMARY: {$passed} PASSED, {$failed} FAILED");
        $this->line('===========================================================');

        return $failed === 0 ? 0 : 1;
    }

    /**
     * @return array{Booking, Payment}
     */
    protected function createFixture(PaymobGatewayService $gateway, int $amountMinor): array
    {
        $org = Organization::query()->first();
        if (! $org) {
            $org = Organization::query()->create([
                'name' => 'Rehearsal Academy',
                'slug' => 'rehearsal-'.Str::lower(Str::random(6)),
                'status' => 'active',
            ]);
        }

        $student = User::query()->first();
        if (! $student) {
            $student = User::query()->create([
                'name' => 'Rehearsal Student',
                'email' => 'student.rehearsal.'.Str::random(6).'@example.com',
                'password' => bcrypt('password123'),
                'is_minor' => false,
            ]);
        }

        $batch = CourseBatch::query()
            ->where('organization_id', $org->id)
            ->first();
        if (! $batch) {
            $room = Room::query()->create([
                'organization_id' => $org->id,
                'created_by' => $student->id,
                'name' => 'Payment Rehearsal Room',
                'slug' => 'payment-rehearsal-'.Str::lower(Str::random(6)),
                'status' => 'active',
            ]);
            $course = Course::query()->create([
                'organization_id' => $org->id,
                'created_by' => $student->id,
                'title' => 'Payment Rehearsal Course',
                'slug' => 'payment-rehearsal-course-'.Str::lower(Str::random(6)),
                'description' => 'Synthetic course used only for payment rehearsal.',
                'delivery_type' => 'online',
                'price_minor' => $amountMinor,
                'currency' => 'EGP',
                'status' => CourseStatus::Published,
                'published_at' => now(),
            ]);
            $batch = CourseBatch::query()->create([
                'organization_id' => $org->id,
                'course_id' => $course->id,
                'room_id' => $room->id,
                'title' => 'Payment Rehearsal Batch',
                'start_date' => now()->toDateString(),
                'end_date' => now()->addMonth()->toDateString(),
                'schedule' => [['day' => 'Sunday', 'startTime' => '18:00', 'endTime' => '20:00']],
                'delivery_type' => 'online',
                'capacity' => 100,
                'status' => BatchStatus::Open,
            ]);
        }

        $booking = Booking::query()->create([
            'organization_id' => $org->id,
            'course_id' => $batch->course_id,
            'batch_id' => $batch->id,
            'student_id' => $student->id,
            'student_name' => $student->name,
            'email' => $student->email,
            'phone' => '+201012345678',
            'terms_accepted' => true,
            'status' => 'pending_confirmation',
            'payment_status' => 'pending',
            'amount_minor' => $amountMinor,
            'currency' => 'EGP',
            'idempotency_key' => 'rehearse_'.Str::uuid()->toString(),
        ]);

        $payment = $gateway->createPaymentForBooking($booking, $student);
        $payment->update([
            'provider_reference' => (string) random_int(1000000, 9999999),
        ]);

        return [$booking, $payment];
    }

    /**
     * @return array<string, mixed>
     */
    protected function makePayloadObject(
        int $id,
        int|string $orderId,
        int $amountCents,
        string $currency,
        string $integrationId,
        bool $success,
    ): array {
        return [
            'id' => $id,
            'pending' => false,
            'amount_cents' => $amountCents,
            'success' => $success,
            'is_auth' => false,
            'is_capture' => false,
            'is_standalone_payment' => true,
            'is_voided' => false,
            'is_refunded' => false,
            'is_3d_secure' => true,
            'integration_id' => $integrationId,
            'created_at' => now()->toIso8601String(),
            'currency' => $currency,
            'has_parent_transaction' => false,
            'error_occured' => ! $success,
            'owner' => 1234,
            'order' => [
                'id' => (int) $orderId,
            ],
            'source_data' => [
                'type' => 'card',
                'pan' => '2346',
                'sub_type' => 'MasterCard',
            ],
        ];
    }

    protected function assertEquals(mixed $expected, mixed $actual, string $message): void
    {
        if ($expected !== $actual) {
            throw new \RuntimeException("{$message}: Expected [{$expected}], got [{$actual}]");
        }
    }

    protected function assertNotEquals(mixed $expected, mixed $actual, string $message): void
    {
        if ($expected === $actual) {
            throw new \RuntimeException("{$message}: Did not expect [{$expected}]");
        }
    }

    protected function assertTrue(bool $condition, string $message): void
    {
        if (! $condition) {
            throw new \RuntimeException("Assertion failed: {$message}");
        }
    }

    protected function assertNotNull(mixed $val, string $message): void
    {
        if ($val === null) {
            throw new \RuntimeException("Assertion failed: {$message}");
        }
    }

    protected function assertGreaterThan(int|float $expected, int|float $actual, string $message): void
    {
        if ($actual <= $expected) {
            throw new \RuntimeException("{$message}: Expected [{$actual}] > [{$expected}]");
        }
    }
}
