<?php

namespace Tests\Feature;

use App\Domain\Marketplace\Enums\BatchStatus;
use App\Domain\Marketplace\Enums\CourseStatus;
use App\Domain\Tenancy\Enums\OrganizationRole;
use App\Models\AcademyProfile;
use App\Models\Booking;
use App\Models\Course;
use App\Models\CourseBatch;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\OrganizationSubscription;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\Role;
use App\Models\Room;
use App\Models\User;
use App\Services\Payments\FinancialReconciliationService;
use Database\Seeders\AuthorizationSeeder;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PaymobRehearsalAndReconciliationTest extends TestCase
{
    use RefreshDatabase;

    public function test_rehearse_paymob_webhook_command_executes_all_scenarios_successfully(): void
    {
        [$organization, $owner, $course, $batch] = $this->marketplace();

        $exitCode = Artisan::call('payments:rehearse-webhook', ['--all' => true]);
        $output = Artisan::output();

        $this->assertEquals(0, $exitCode, "Rehearsal command must exit with code 0 on all scenarios passing.\n{$output}");
        $this->assertStringContainsString('Happy-path Success Webhook', $output);
        $this->assertStringContainsString('Idempotency & Duplicate Replay Protection', $output);
        $this->assertStringContainsString('Failed Payment Webhook Handling', $output);
        $this->assertStringContainsString('Refund Flow (Partial & Full)', $output);
        $this->assertStringContainsString('Signature Tampering & Forgery Resistance', $output);
        $this->assertStringContainsString('Webhook Amount Mismatch Protection', $output);
        $this->assertStringContainsString('6 PASSED, 0 FAILED', $output);
    }

    public function test_authorized_staff_can_process_partial_and_full_refunds(): void
    {
        [$organization, $owner, $course, $batch] = $this->marketplace();
        $student = User::factory()->create(['email' => 'student.refund@example.com']);

        $booking = Booking::query()->create([
            'organization_id' => $organization->id,
            'course_id' => $course->id,
            'batch_id' => $batch->id,
            'student_id' => $student->id,
            'student_name' => 'Refund Student',
            'email' => $student->email,
            'normalized_email' => $student->email,
            'phone' => '+201012345678',
            'terms_accepted' => true,
            'status' => 'confirmed',
            'payment_status' => 'paid',
            'amount_minor' => 100000,
            'currency' => 'EGP',
            'idempotency_key' => 'book-refund-001',
        ]);

        $payment = Payment::query()->create([
            'organization_id' => $organization->id,
            'booking_id' => $booking->id,
            'user_id' => $student->id,
            'provider' => 'paymob',
            'provider_reference' => 'paymob_ord_112233',
            'idempotency_key' => 'pay-refund-001',
            'amount_minor' => 100000,
            'refunded_amount_minor' => 0,
            'fee_minor' => 3050,
            'net_minor' => 96950,
            'currency' => 'EGP',
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        // Act as organization owner
        Sanctum::actingAs($owner);

        // 1. Partial refund of 40,000 minor units (400 EGP)
        $partialResponse = $this->postJson("/api/v1/payments/{$payment->id}/refund", [
            'amount_minor' => 40000,
            'reason' => 'Partial schedule adjustment',
        ])
            ->assertOk()
            ->assertJsonPath('data.refund.amount_minor', 40000)
            ->assertJsonPath('data.refund.status', 'succeeded')
            ->assertJsonPath('data.payment.status', 'partially_refunded')
            ->assertJsonPath('data.payment.refunded_amount_minor', 40000)
            ->assertJsonPath('data.payment.remaining_refundable_minor', 60000);

        $this->assertDatabaseHas('payment_refunds', [
            'payment_id' => $payment->id,
            'amount_minor' => 40000,
            'status' => 'succeeded',
        ]);

        // 2. Full remaining refund of 60,000 minor units
        $fullResponse = $this->postJson("/api/v1/payments/{$payment->id}/refund", [
            'amount_minor' => 60000,
            'reason' => 'Remaining cancellation refund',
        ])
            ->assertOk()
            ->assertJsonPath('data.refund.amount_minor', 60000)
            ->assertJsonPath('data.payment.status', 'refunded')
            ->assertJsonPath('data.payment.refunded_amount_minor', 100000)
            ->assertJsonPath('data.payment.remaining_refundable_minor', 0);

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => 'refunded',
            'refunded_amount_minor' => 100000,
        ]);

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'payment_status' => 'refunded',
        ]);

        $this->assertDatabaseHas('outbox_events', [
            'event_type' => 'payment.refunded',
            'aggregate_type' => 'PaymentRefund',
        ]);
    }

    public function test_refund_fails_when_amount_exceeds_remaining_or_unpaid(): void
    {
        [$organization, $owner, $course, $batch] = $this->marketplace();
        $student = User::factory()->create();
        Sanctum::actingAs($owner);

        // Case A: Payment is pending (not paid)
        $pendingPayment = Payment::query()->create([
            'organization_id' => $organization->id,
            'user_id' => $student->id,
            'provider' => 'paymob',
            'idempotency_key' => 'pay-pending-002',
            'amount_minor' => 50000,
            'currency' => 'EGP',
            'status' => 'pending',
        ]);

        $this->postJson("/api/v1/payments/{$pendingPayment->id}/refund", [
            'amount_minor' => 50000,
        ])
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'PAYMENT_NOT_REFUNDABLE');

        // Case B: Refund amount exceeds payment total
        $paidPayment = Payment::query()->create([
            'organization_id' => $organization->id,
            'user_id' => $student->id,
            'provider' => 'paymob',
            'idempotency_key' => 'pay-paid-003',
            'amount_minor' => 50000,
            'refunded_amount_minor' => 0,
            'currency' => 'EGP',
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        $this->postJson("/api/v1/payments/{$paidPayment->id}/refund", [
            'amount_minor' => 60000,
        ])
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'REFUND_EXCEEDS_PAYMENT');
    }

    public function test_unauthorized_user_cannot_refund_payment(): void
    {
        [$organization, $owner, $course, $batch] = $this->marketplace();
        $student = User::factory()->create();

        $payment = Payment::query()->create([
            'organization_id' => $organization->id,
            'user_id' => $student->id,
            'provider' => 'paymob',
            'idempotency_key' => 'pay-unauth-004',
            'amount_minor' => 50000,
            'currency' => 'EGP',
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        // Student tries to issue a refund to themselves
        Sanctum::actingAs($student);
        $this->postJson("/api/v1/payments/{$payment->id}/refund", [
            'amount_minor' => 50000,
        ])
            ->assertStatus(403)
            ->assertJsonPath('error.code', 'FORBIDDEN');
    }

    public function test_financial_reconciliation_calculates_correct_totals_and_fees(): void
    {
        [$organization, $owner, $course, $batch] = $this->marketplace();

        // Payment 1: Paid 1000 EGP (100000 minor)
        Payment::query()->create([
            'organization_id' => $organization->id,
            'provider' => 'paymob',
            'idempotency_key' => 'rec-pay-001',
            'amount_minor' => 100000,
            'refunded_amount_minor' => 0,
            'fee_minor' => 3050,
            'net_minor' => 96950,
            'currency' => 'EGP',
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        // Payment 2: Partially refunded (500 EGP paid, 200 EGP refunded)
        Payment::query()->create([
            'organization_id' => $organization->id,
            'provider' => 'paymob',
            'idempotency_key' => 'rec-pay-002',
            'amount_minor' => 50000,
            'refunded_amount_minor' => 20000,
            'fee_minor' => 1675,
            'net_minor' => 28325,
            'currency' => 'EGP',
            'status' => 'partially_refunded',
            'paid_at' => now(),
        ]);

        // Payment 3: Failed payment
        Payment::query()->create([
            'organization_id' => $organization->id,
            'provider' => 'paymob',
            'idempotency_key' => 'rec-pay-003',
            'amount_minor' => 30000,
            'currency' => 'EGP',
            'status' => 'failed',
            'failed_at' => now(),
        ]);

        $service = app(FinancialReconciliationService::class);
        $report = $service->reconcile(
            from: now()->subDay(),
            to: now()->addDay(),
            organizationId: $organization->id,
        );

        $this->assertEquals(3, $report['summary']['total_payments_count']);
        $this->assertEquals(1, $report['summary']['paid_count']);
        $this->assertEquals(1, $report['summary']['partially_refunded_count']);
        $this->assertEquals(1, $report['summary']['failed_count']);
        $this->assertEquals(150000, $report['summary']['gross_volume_minor']);
        $this->assertEquals(20000, $report['summary']['refunded_volume_minor']);
        $this->assertEquals(4725, $report['summary']['fee_volume_minor']);
        $this->assertEquals(125275, $report['summary']['net_volume_minor']);
    }

    public function test_reconciliation_detects_unconfirmed_paid_booking_and_auto_fixes_it(): void
    {
        [$organization, $owner, $course, $batch] = $this->marketplace();
        $student = User::factory()->create();

        $booking = Booking::query()->create([
            'organization_id' => $organization->id,
            'course_id' => $course->id,
            'batch_id' => $batch->id,
            'student_id' => $student->id,
            'student_name' => 'Auto Fix Student',
            'email' => $student->email,
            'normalized_email' => $student->email,
            'phone' => '+201012345678',
            'terms_accepted' => true,
            'status' => 'pending_confirmation', // Left unconfirmed!
            'payment_status' => 'pending',
            'amount_minor' => 100000,
            'currency' => 'EGP',
            'idempotency_key' => 'autofix-booking-001',
        ]);

        $payment = Payment::query()->create([
            'organization_id' => $organization->id,
            'booking_id' => $booking->id,
            'user_id' => $student->id,
            'provider' => 'paymob',
            'idempotency_key' => 'autofix-pay-001',
            'amount_minor' => 100000,
            'currency' => 'EGP',
            'status' => 'paid', // Verified paid!
            'paid_at' => now(),
        ]);

        // Run reconciliation command with --auto-fix
        $exitCode = Artisan::call('payments:reconcile', [
            '--auto-fix' => true,
            '--org' => $organization->id,
        ]);

        $output = Artisan::output();
        $this->assertStringContainsString('Auto-Fixed', $output);
        $this->assertStringContainsString("Confirmed booking {$booking->id}", $output);

        // Assert booking is now confirmed in database!
        $this->assertEquals('confirmed', $booking->fresh()->status->value);
        $this->assertEquals('paid', $booking->fresh()->payment_status);
    }

    public function test_reconciliation_api_endpoint_accessible_to_organization_owner(): void
    {
        [$organization, $owner, $course, $batch] = $this->marketplace();
        Sanctum::actingAs($owner);

        $response = $this->getJson("/api/v1/payments/reconciliation?organization_id={$organization->id}")
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'reconciliation_time',
                    'period',
                    'health_status',
                    'summary' => [
                        'total_payments_count',
                        'gross_volume_minor',
                        'net_volume_minor',
                    ],
                    'discrepancies',
                ],
            ]);
    }

    /**
     * @return array{Organization, User, Course, CourseBatch}
     */
    protected function marketplace(): array
    {
        $this->seed(PlanSeeder::class);
        $this->seed(AuthorizationSeeder::class);

        $owner = User::factory()->create([
            'name' => 'Owner User',
            'email' => 'owner.pay.'.Str::random(6).'@example.com',
        ]);
        $organization = Organization::query()->create([
            'name' => 'Payment Test Academy',
            'slug' => 'payment-test-academy-'.Str::random(6),
            'status' => 'active',
        ]);
        $ownerRole = Role::query()
            ->whereNull('organization_id')
            ->where('name', OrganizationRole::Owner->value)
            ->firstOrFail();
        OrganizationMembership::query()->create([
            'organization_id' => $organization->id,
            'user_id' => $owner->id,
            'role_id' => $ownerRole->id,
            'status' => 'active',
            'joined_at' => now(),
        ]);
        $plan = Plan::query()->where('code', 'growth')->firstOrFail();
        OrganizationSubscription::query()->create([
            'organization_id' => $organization->id,
            'plan_id' => $plan->id,
            'status' => 'trial',
            'billing_interval' => 'monthly',
            'trial_ends_at' => now()->addDays(14),
            'current_period_starts_at' => now(),
            'current_period_ends_at' => now()->addDays(14),
        ]);
        $profile = AcademyProfile::query()->create([
            'organization_id' => $organization->id,
            'slug' => 'payment-academy-'.Str::random(6),
            'public_name' => 'Payment Academy',
            'description' => 'A verified academy profile for payments test.',
            'is_public' => true,
            'verification_status' => 'verified',
            'verified_at' => now(),
        ]);
        $room = Room::query()->create([
            'organization_id' => $organization->id,
            'created_by' => $owner->id,
            'name' => 'Physics Room',
            'slug' => 'physics-room-'.Str::random(6),
            'status' => 'active',
        ]);
        $course = Course::query()->create([
            'organization_id' => $organization->id,
            'academy_profile_id' => $profile->id,
            'created_by' => $owner->id,
            'title' => 'Physics Grade 12',
            'slug' => 'physics-grade-12-'.Str::random(6),
            'description' => 'Complete physics course.',
            'delivery_type' => 'online',
            'price_minor' => 100000,
            'currency' => 'EGP',
            'status' => CourseStatus::Published,
            'published_at' => now(),
        ]);
        $batch = CourseBatch::query()->create([
            'organization_id' => $organization->id,
            'course_id' => $course->id,
            'room_id' => $room->id,
            'title' => 'August Batch',
            'start_date' => now()->addDays(5)->toDateString(),
            'end_date' => now()->addMonths(2)->toDateString(),
            'schedule' => [[
                'day' => 'Sunday',
                'startTime' => '18:00',
                'endTime' => '20:00',
            ]],
            'delivery_type' => 'online',
            'capacity' => 10,
            'status' => BatchStatus::Open,
        ]);

        return [$organization, $owner, $course, $batch];
    }
}
