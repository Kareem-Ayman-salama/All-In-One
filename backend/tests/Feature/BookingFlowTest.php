<?php

namespace Tests\Feature;

use App\Domain\Marketplace\Enums\BatchStatus;
use App\Domain\Marketplace\Enums\CourseStatus;
use App\Domain\Tenancy\Enums\OrganizationRole;
use App\Models\AcademyProfile;
use App\Models\Course;
use App\Models\CourseBatch;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\OrganizationSubscription;
use App\Models\Plan;
use App\Models\Role;
use App\Models\Room;
use App\Models\StudentSubscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BookingFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_last_seat_booking_is_idempotent_and_cannot_be_oversold(): void
    {
        [$organization, $owner, $course, $batch] = $this->marketplace();
        $student = User::factory()->create(['email' => 'student@example.com']);
        Sanctum::actingAs($student);
        $payload = [
            'courseId' => $course->id,
            'batchId' => $batch->id,
            'studentName' => 'AIO Student',
            'email' => 'student@example.com',
            'phone' => '+201000000000',
            'termsAccepted' => true,
            'idempotencyKey' => 'booking-request-00000001',
        ];

        $first = $this->postJson('/api/v1/public/bookings', $payload)
            ->assertCreated()
            ->assertJsonPath(
                'data.booking.status',
                'pending_confirmation',
            );
        $bookingId = $first->json('data.booking.id');
        $this->assertDatabaseHas('course_batches', [
            'id' => $batch->id,
            'reserved_seats' => 1,
            'confirmed_seats' => 0,
            'status' => BatchStatus::Full->value,
        ]);

        $this->postJson('/api/v1/public/bookings', $payload)
            ->assertCreated()
            ->assertJsonPath('data.booking.id', $bookingId);
        $this->assertDatabaseCount('bookings', 1);

        $secondStudent = User::factory()->create([
            'email' => 'second@example.com',
        ]);
        Sanctum::actingAs($secondStudent);
        $this->postJson('/api/v1/public/bookings', [
            ...$payload,
            'email' => 'second@example.com',
        ])
            ->assertConflict()
            ->assertJsonPath('error.code', 'IDEMPOTENCY_KEY_CONFLICT');

        $this->postJson('/api/v1/public/bookings', [
            ...$payload,
            'email' => 'second@example.com',
            'idempotencyKey' => 'booking-request-00000002',
        ])
            ->assertConflict()
            ->assertJsonPath('error.code', 'BATCH_NOT_BOOKABLE');

        Sanctum::actingAs($owner);
        $endpoint = "/api/v1/organizations/{$organization->id}"
            ."/bookings/{$bookingId}/confirm";
        $this->postJson($endpoint, ['markAsPaid' => true])
            ->assertOk()
            ->assertJsonPath('data.status', 'confirmed')
            ->assertJsonPath('data.payment_status', 'paid');
        $this->postJson($endpoint, ['markAsPaid' => true])
            ->assertOk()
            ->assertJsonPath('data.status', 'confirmed');

        $this->assertDatabaseCount('course_enrollments', 1);
        $this->assertDatabaseCount('student_subscriptions', 1);
        $this->assertDatabaseCount('room_memberships', 1);
        $this->assertDatabaseHas('course_batches', [
            'id' => $batch->id,
            'reserved_seats' => 0,
            'confirmed_seats' => 1,
            'status' => BatchStatus::Full->value,
        ]);
        $this->assertDatabaseHas('organization_memberships', [
            'organization_id' => $organization->id,
            'user_id' => $student->id,
            'status' => 'active',
        ]);
        $this->assertDatabaseHas('notifications', [
            'user_id' => $student->id,
            'type' => 'booking_confirmed',
        ]);

        Sanctum::actingAs($student);
        $roomEndpoint = "/api/v1/organizations/{$organization->id}"
            ."/rooms/{$batch->room_id}";
        $this->getJson($roomEndpoint)->assertOk();

        StudentSubscription::query()
            ->where('student_id', $student->id)
            ->update(['ends_at' => now()->subMinute()]);

        $this->getJson($roomEndpoint)
            ->assertForbidden()
            ->assertJsonPath('error.code', 'ROOM_ACCESS_DENIED');
    }

    public function test_unpublished_course_is_not_public_or_bookable(): void
    {
        [, , $course, $batch] = $this->marketplace();
        $course->update([
            'status' => CourseStatus::Draft,
            'published_at' => null,
        ]);
        $student = User::factory()->create(['email' => 'student@example.com']);

        $this->getJson("/api/v1/public/courses/{$course->id}")
            ->assertNotFound();

        Sanctum::actingAs($student);
        $this->postJson('/api/v1/public/bookings', [
            'courseId' => $course->id,
            'batchId' => $batch->id,
            'studentName' => 'AIO Student',
            'email' => 'student@example.com',
            'phone' => '+201000000000',
            'termsAccepted' => true,
        ])
            ->assertConflict()
            ->assertJsonPath('error.code', 'COURSE_NOT_BOOKABLE');
    }

    /**
     * @return array{Organization, User, Course, CourseBatch}
     */
    private function marketplace(): array
    {
        $this->seed();
        $owner = User::factory()->create();
        $organization = Organization::query()->create([
            'name' => 'Verified Academy',
            'slug' => 'verified-academy',
            'type' => 'academy',
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
            'slug' => 'verified-academy',
            'public_name' => 'Verified Academy',
            'description' => 'A verified public academy profile for testing.',
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
            'capacity' => 1,
            'status' => BatchStatus::Open,
        ]);

        return [$organization, $owner, $course, $batch];
    }
}
