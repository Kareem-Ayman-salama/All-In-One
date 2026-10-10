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
use App\Services\Payments\PaymobGatewayService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PaymentOperationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_initiate_payment_checkout_for_booking(): void
    {
        [$organization, $owner, $course, $batch] = $this->marketplace();
        $student = User::factory()->create(['email' => 'student.pay@example.com']);
        Sanctum::actingAs($student);

        $booking = Booking::query()->create([
            'organization_id' => $organization->id,
            'course_id' => $course->id,
            'batch_id' => $batch->id,
            'student_id' => $student->id,
            'student_name' => 'Paying Student',
            'email' => 'student.pay@example.com',
            'normalized_email' => 'student.pay@example.com',
            'phone' => '+201012345678',
            'terms_accepted' => true,
            'status' => 'pending_confirmation',
            'payment_status' => 'pending',
            'amount_minor' => 100000,
            'currency' => 'EGP',
            'idempotency_key' => 'booking-pay-001',
        ]);

        $response = $this->postJson('/api/v1/payments/checkout', [
            'booking_id' => $booking->id,
            'payment_method' => 'paymob',
        ])
            ->assertOk()
            ->assertJsonPath('data.provider', 'paymob')
            ->assertJsonStructure([
                'data' => [
                    'provider',
                    'payment_id',
                    'client_secret',
                    'checkout_url',
                    'amount_minor',
                    'currency',
                ],
            ]);

        $this->assertDatabaseHas('payments', [
            'booking_id' => $booking->id,
            'provider' => 'paymob',
            'status' => 'pending',
            'amount_minor' => 100000,
        ]);
    }

    public function test_simulated_payment_success_auto_confirms_booking_and_enrolls_student(): void
    {
        config()->set('services.paymob.allow_simulation', true);
        [$organization, $owner, $course, $batch] = $this->marketplace();
        $student = User::factory()->create(['email' => 'student.enroll@example.com']);
        Sanctum::actingAs($student);

        $booking = Booking::query()->create([
            'organization_id' => $organization->id,
            'course_id' => $course->id,
            'batch_id' => $batch->id,
            'student_id' => $student->id,
            'student_name' => 'Enroll Student',
            'email' => 'student.enroll@example.com',
            'normalized_email' => 'student.enroll@example.com',
            'phone' => '+201012345678',
            'terms_accepted' => true,
            'status' => 'pending_confirmation',
            'payment_status' => 'pending',
            'amount_minor' => 100000,
            'currency' => 'EGP',
            'idempotency_key' => 'booking-enroll-002',
        ]);

        $checkout = $this->postJson('/api/v1/payments/checkout', [
            'booking_id' => $booking->id,
        ])->assertOk();

        $paymentId = $checkout->json('data.payment_id');

        $simulate = $this->postJson('/api/v1/payments/simulate-success', [
            'payment_id' => $paymentId,
        ])
            ->assertOk()
            ->assertJsonPath('data.payment.status', 'paid')
            ->assertJsonPath('data.booking.status', 'confirmed');

        $this->assertDatabaseHas('payments', [
            'id' => $paymentId,
            'status' => 'paid',
        ]);

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => 'confirmed',
            'payment_status' => 'paid',
        ]);

        $this->assertDatabaseHas('course_enrollments', [
            'booking_id' => $booking->id,
            'student_id' => $student->id,
            'status' => 'active',
        ]);

        $this->assertDatabaseHas('outbox_events', [
            'event_type' => 'payment.succeeded',
            'aggregate_type' => 'Payment',
            'aggregate_id' => $paymentId,
        ]);
    }

    public function test_paymob_webhook_processes_success_and_is_idempotent(): void
    {
        [$organization, $owner, $course, $batch] = $this->marketplace();
        $student = User::factory()->create(['email' => 'student.webhook@example.com']);
        Sanctum::actingAs($student);

        $booking = Booking::query()->create([
            'organization_id' => $organization->id,
            'course_id' => $course->id,
            'batch_id' => $batch->id,
            'student_id' => $student->id,
            'student_name' => 'Webhook Student',
            'email' => 'student.webhook@example.com',
            'normalized_email' => 'student.webhook@example.com',
            'phone' => '+201012345678',
            'terms_accepted' => true,
            'status' => 'pending_confirmation',
            'payment_status' => 'pending',
            'amount_minor' => 100000,
            'currency' => 'EGP',
            'idempotency_key' => 'booking-webhook-003',
        ]);

        $checkout = $this->postJson('/api/v1/payments/checkout', [
            'booking_id' => $booking->id,
        ])->assertOk();

        $orderId = $checkout->json('data.provider_reference');
        $paymentId = $checkout->json('data.payment_id');

        $integrationId = (string) (config('services.paymob.integration_id') ?: '123456');
        config(['services.paymob.integration_id' => $integrationId]);

        $webhookPayload = [
            'type' => 'TRANSACTION',
            'obj' => [
                'id' => 98765432,
                'integration_id' => $integrationId,
                'order' => [
                    'id' => $orderId,
                ],
                'success' => true,
                'amount_cents' => 100000,
                'currency' => 'EGP',
            ],
        ];

        $hmacSecret = 'test_webhook_secret_key_12345';
        config(['services.paymob.hmac_secret' => $hmacSecret]);

        // Unsigned request is rejected with 401
        $this->postJson('/api/v1/payments/webhook/paymob', $webhookPayload)
            ->assertStatus(401);

        // Tampered signature is rejected with 403
        $this->postJson('/api/v1/payments/webhook/paymob?hmac=invalid_signature', $webhookPayload)
            ->assertStatus(403);

        $signature = app(PaymobGatewayService::class)->calculateHmac(
            $webhookPayload['obj'],
            $hmacSecret,
        );

        // Valid HMAC signed webhook succeeds
        $first = $this->postJson('/api/v1/payments/webhook/paymob?hmac='.$signature, $webhookPayload)
            ->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('payment_status', 'paid');

        $this->assertDatabaseHas('payments', [
            'id' => $paymentId,
            'status' => 'paid',
        ]);

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => 'confirmed',
        ]);

        // Duplicate webhook call should be idempotent
        $duplicate = $this->postJson('/api/v1/payments/webhook/paymob?hmac='.$signature, $webhookPayload)
            ->assertOk()
            ->assertJsonPath('status', 'already_processed');
    }

    public function test_guest_cannot_simulate_payment_success(): void
    {
        $this->postJson('/api/v1/payments/simulate-success', [
            'payment_id' => '00000000-0000-0000-0000-000000000000',
        ])->assertStatus(401);
    }

    public function test_payment_status_endpoint_is_secured_and_sanitized(): void
    {
        [$organization, $owner, $course, $batch] = $this->marketplace();
        $student = User::factory()->create();
        $otherUser = User::factory()->create();

        $booking = Booking::query()->create([
            'organization_id' => $organization->id,
            'course_id' => $course->id,
            'batch_id' => $batch->id,
            'student_id' => $student->id,
            'student_name' => 'Secret Student',
            'email' => 'student.secret@example.com',
            'normalized_email' => 'student.secret@example.com',
            'phone' => '+201012345678',
            'terms_accepted' => true,
            'status' => 'pending_confirmation',
            'payment_status' => 'pending',
            'amount_minor' => 100000,
            'currency' => 'EGP',
            'idempotency_key' => 'booking-secret-004',
        ]);

        $payment = Payment::query()->create([
            'organization_id' => $organization->id,
            'booking_id' => $booking->id,
            'user_id' => $student->id,
            'provider' => 'paymob',
            'amount_minor' => 100000,
            'currency' => 'EGP',
            'status' => 'pending',
            'idempotency_key' => 'pay-secret-004',
            'metadata' => ['client_secret' => 'super_secret_client_token_xyz'],
        ]);

        // Unauthorized user cannot read status
        Sanctum::actingAs($otherUser);
        $this->getJson("/api/v1/payments/{$payment->id}/status")
            ->assertStatus(403);

        // Owner can read sanitized status
        Sanctum::actingAs($student);
        $res = $this->getJson("/api/v1/payments/{$payment->id}/status")
            ->assertOk();

        // Ensure sensitive metadata is NOT leaked in response
        $this->assertArrayNotHasKey('metadata', $res->json('data.payment'));
        $this->assertEquals($payment->id, $res->json('data.payment.id'));
    }

    public function test_student_cannot_read_another_students_payment(): void
    {
        [$organization, $owner, $course, $batch] = $this->marketplace();
        $studentA = User::factory()->create(['email' => 'student.a@example.com']);
        $studentB = User::factory()->create(['email' => 'student.b@example.com']);

        $booking = Booking::query()->create([
            'organization_id' => $organization->id,
            'course_id' => $course->id,
            'batch_id' => $batch->id,
            'student_id' => $studentA->id,
            'student_name' => 'Student A',
            'email' => 'student.a@example.com',
            'normalized_email' => 'student.a@example.com',
            'phone' => '+201011111111',
            'terms_accepted' => true,
            'status' => 'pending_confirmation',
            'payment_status' => 'pending',
            'amount_minor' => 100000,
            'currency' => 'EGP',
            'idempotency_key' => 'booking-peer-001',
        ]);

        $payment = Payment::query()->create([
            'organization_id' => $organization->id,
            'booking_id' => $booking->id,
            'user_id' => $studentA->id,
            'provider' => 'paymob',
            'amount_minor' => 100000,
            'currency' => 'EGP',
            'status' => 'pending',
            'idempotency_key' => 'pay-peer-001',
            'metadata' => ['client_secret_hash' => hash('sha256', 'tok_a')],
        ]);

        // Student B in same academy cannot read Student A's payment
        Sanctum::actingAs($studentB);
        $this->getJson("/api/v1/payments/{$payment->id}/status")
            ->assertStatus(403);
    }

    public function test_admin_and_finance_can_read_organization_payments(): void
    {
        [$organization, $owner, $course, $batch] = $this->marketplace();
        $student = User::factory()->create(['email' => 'student.target@example.com']);

        $booking = Booking::query()->create([
            'organization_id' => $organization->id,
            'course_id' => $course->id,
            'batch_id' => $batch->id,
            'student_id' => $student->id,
            'student_name' => 'Student Target',
            'email' => 'student.target@example.com',
            'normalized_email' => 'student.target@example.com',
            'phone' => '+201012345678',
            'terms_accepted' => true,
            'status' => 'pending_confirmation',
            'payment_status' => 'pending',
            'amount_minor' => 100000,
            'currency' => 'EGP',
            'idempotency_key' => 'booking-admin-view-001',
        ]);

        $payment = Payment::query()->create([
            'organization_id' => $organization->id,
            'booking_id' => $booking->id,
            'user_id' => $student->id,
            'provider' => 'paymob',
            'amount_minor' => 100000,
            'currency' => 'EGP',
            'status' => 'pending',
            'idempotency_key' => 'pay-admin-view-001',
            'metadata' => ['client_secret_hash' => hash('sha256', 'tok_target')],
        ]);

        // Org owner/admin can read the student's payment
        Sanctum::actingAs($owner);
        $this->getJson("/api/v1/payments/{$payment->id}/status")
            ->assertOk()
            ->assertJsonPath('data.payment.id', $payment->id);
    }

    public function test_paymob_webhook_rejects_missing_required_fields_with_422(): void
    {
        [$organization, $owner, $course, $batch] = $this->marketplace();
        $student = User::factory()->create(['email' => 'student.fields@example.com']);
        Sanctum::actingAs($student);

        $booking = Booking::query()->create([
            'organization_id' => $organization->id,
            'course_id' => $course->id,
            'batch_id' => $batch->id,
            'student_id' => $student->id,
            'student_name' => 'Field Test Student',
            'email' => 'student.fields@example.com',
            'normalized_email' => 'student.fields@example.com',
            'phone' => '+201012345678',
            'terms_accepted' => true,
            'status' => 'pending_confirmation',
            'payment_status' => 'pending',
            'amount_minor' => 100000,
            'currency' => 'EGP',
            'idempotency_key' => 'booking-field-test-001',
        ]);

        $checkout = $this->postJson('/api/v1/payments/checkout', [
            'booking_id' => $booking->id,
        ])->assertOk();

        $orderId = $checkout->json('data.provider_reference');
        $integrationId = '123456';
        $hmacSecret = 'test_webhook_secret_key_12345';
        config([
            'services.paymob.integration_id' => $integrationId,
            'services.paymob.hmac_secret' => $hmacSecret,
        ]);

        $service = app(PaymobGatewayService::class);

        // 1. Missing amount_cents
        $payloadMissingAmount = [
            'type' => 'TRANSACTION',
            'obj' => [
                'id' => 100001,
                'integration_id' => $integrationId,
                'order' => ['id' => $orderId],
                'success' => true,
                'currency' => 'EGP',
            ],
        ];
        $sig1 = $service->calculateHmac($payloadMissingAmount['obj'], $hmacSecret);
        $this->postJson("/api/v1/payments/webhook/paymob?hmac={$sig1}", $payloadMissingAmount)
            ->assertStatus(422);

        // 2. Missing currency
        $payloadMissingCurrency = [
            'type' => 'TRANSACTION',
            'obj' => [
                'id' => 100002,
                'integration_id' => $integrationId,
                'order' => ['id' => $orderId],
                'success' => true,
                'amount_cents' => 100000,
            ],
        ];
        $sig2 = $service->calculateHmac($payloadMissingCurrency['obj'], $hmacSecret);
        $this->postJson("/api/v1/payments/webhook/paymob?hmac={$sig2}", $payloadMissingCurrency)
            ->assertStatus(422);

        // 3. Missing integration_id
        $payloadMissingIntegration = [
            'type' => 'TRANSACTION',
            'obj' => [
                'id' => 100003,
                'order' => ['id' => $orderId],
                'success' => true,
                'amount_cents' => 100000,
                'currency' => 'EGP',
            ],
        ];
        $sig3 = $service->calculateHmac($payloadMissingIntegration['obj'], $hmacSecret);
        $this->postJson("/api/v1/payments/webhook/paymob?hmac={$sig3}", $payloadMissingIntegration)
            ->assertStatus(422);
    }

    private function marketplace(): array
    {
        $this->seed();
        $owner = User::factory()->create();
        $organization = Organization::query()->create([
            'name' => 'Payment Test Academy',
            'slug' => 'payment-test-academy',
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
            'slug' => 'payment-academy',
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
            'slug' => 'physics-room',
            'status' => 'active',
        ]);
        $course = Course::query()->create([
            'organization_id' => $organization->id,
            'academy_profile_id' => $profile->id,
            'created_by' => $owner->id,
            'title' => 'Physics Grade 12',
            'slug' => 'physics-grade-12',
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
