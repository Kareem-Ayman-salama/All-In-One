<?php

namespace Tests\Feature;

use App\Domain\Marketplace\Enums\BatchStatus;
use App\Domain\Marketplace\Enums\CourseStatus;
use App\Domain\Tenancy\Enums\OrganizationRole;
use App\Models\AcademyProfile;
use App\Models\Course;
use App\Models\CourseBatch;
use App\Models\Instructor;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\OrganizationSubscription;
use App\Models\Plan;
use App\Models\Role;
use App\Models\Room;
use App\Models\User;
use App\Notifications\AttendanceAlertNotification;
use App\Notifications\GuardianAbsenceThresholdNotification;
use App\Notifications\GuardianWeeklyAttendanceNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification as NotificationFacade;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AttendanceAndReportsTest extends TestCase
{
    use RefreshDatabase;

    public function test_absence_is_visible_to_guardian_and_exportable(): void
    {
        NotificationFacade::fake();
        [$organization, $owner, $course, $batch] = $this->academy();
        $student = User::factory()->create([
            'email' => 'student@example.com',
            'email_verified_at' => now(),
        ]);
        Sanctum::actingAs($student);
        $booking = $this->postJson('/api/v1/public/bookings', [
            'courseId' => $course->id,
            'batchId' => $batch->id,
            'studentName' => 'AIO Student',
            'email' => $student->email,
            'phone' => '+201000000000',
            'termsAccepted' => true,
        ])->assertCreated()->json('data.booking');

        Sanctum::actingAs($owner);
        $this->postJson(
            "/api/v1/organizations/{$organization->id}/bookings/{$booking['id']}/confirm",
            ['markAsPaid' => true],
        )->assertOk();

        $guardian = User::factory()->create([
            'email' => 'parent@example.com',
            'email_verified_at' => now(),
        ]);
        $this->postJson("/api/v1/organizations/{$organization->id}/guardians", [
            'guardianEmail' => $guardian->email,
            'studentId' => $student->id,
            'relationship' => 'mother',
            'canViewNotes' => true,
            'weeklyReportEnabled' => true,
            'absenceAlertThreshold' => 1,
        ])->assertCreated();

        $session = $this->postJson(
            "/api/v1/organizations/{$organization->id}/learning-sessions",
            [
                'batchId' => $batch->id,
                'title' => 'Physics revision',
                'startsAt' => now()->subHour()->toIso8601String(),
                'endsAt' => now()->toIso8601String(),
            ],
        )->assertCreated()
            ->assertJsonPath('data.participantCount', 1)
            ->json('data.session');

        $this->putJson(
            "/api/v1/organizations/{$organization->id}/learning-sessions/{$session['id']}/attendance",
            ['records' => [[
                'studentId' => $student->id,
                'status' => 'absent',
                'instructorNote' => 'Please review chapter four.',
                'guardianVisible' => true,
            ]]],
        )->assertOk()
            ->assertJsonPath('data.0.status', 'absent');

        $this->assertDatabaseHas('attendance_records', [
            'student_id' => $student->id,
            'status' => 'absent',
        ]);
        $this->assertDatabaseHas('notifications', [
            'user_id' => $guardian->id,
            'type' => 'attendance_alert',
        ]);
        $this->putJson(
            "/api/v1/organizations/{$organization->id}/learning-sessions/{$session['id']}/attendance",
            ['records' => [[
                'studentId' => $student->id,
                'status' => 'absent',
                'instructorNote' => 'Please review chapter four.',
                'guardianVisible' => true,
            ]]],
        )->assertOk();
        NotificationFacade::assertSentToTimes(
            $guardian,
            AttendanceAlertNotification::class,
            1,
        );
        NotificationFacade::assertSentToTimes(
            $guardian,
            GuardianAbsenceThresholdNotification::class,
            1,
        );

        Sanctum::actingAs($guardian);
        $this->getJson("/api/v1/guardian/students/{$student->id}/attendance")
            ->assertOk()
            ->assertJsonPath('data.student.id', $student->id)
            ->assertJsonPath('data.records.0.status', 'absent')
            ->assertJsonPath('data.summary.absent', 1);

        Sanctum::actingAs($owner);
        $attendanceExport = $this->get(
            "/api/v1/organizations/{$organization->id}/reports/attendance?format=xlsx",
        );
        $attendanceExport->assertOk()
            ->assertHeader('content-type', 'application/vnd.ms-excel; charset=UTF-8');
        $this->assertStringContainsString(
            'Please review chapter four.',
            $attendanceExport->streamedContent(),
        );

        $bookingExport = $this->get(
            "/api/v1/organizations/{$organization->id}/reports/bookings?format=csv",
        );
        $bookingExport->assertOk()
            ->assertHeader('content-type', 'text/csv; charset=UTF-8');
        $bookingContent = $bookingExport->streamedContent();
        $this->assertStringContainsString('AIO Student', $bookingContent);
        $this->assertStringContainsString('Physics Grade 12', $bookingContent);
        $this->assertStringContainsString('+201000000000', $bookingContent);

        $this->postJson(
            "/api/v1/organizations/{$organization->id}/guardians/weekly-reports/send",
        )->assertOk()
            ->assertJsonPath('data.sentCount', 1);
        NotificationFacade::assertSentToTimes(
            $guardian,
            GuardianWeeklyAttendanceNotification::class,
            1,
        );

        $qr = $this->postJson(
            "/api/v1/organizations/{$organization->id}/learning-sessions/{$session['id']}/attendance/qr",
            ['validForMinutes' => 10],
        )->assertOk()->json('data');

        Sanctum::actingAs($student);
        $this->postJson('/api/v1/student/attendance/check-in', [
            'sessionId' => $session['id'],
            'token' => $qr['token'],
        ])->assertOk()
            ->assertJsonPath('data.status', 'present');

        Sanctum::actingAs($owner);
        $this->getJson(
            "/api/v1/organizations/{$organization->id}/learning-sessions/{$session['id']}/attendance/history",
        )->assertOk()
            ->assertJsonFragment(['action' => 'attendance.qr_generated'])
            ->assertJsonFragment(['action' => 'attendance.marked']);
    }

    public function test_private_lesson_has_one_attendance_participant(): void
    {
        [$organization, $owner] = $this->academy();
        $instructor = Instructor::query()->create([
            'organization_id' => $organization->id,
            'name' => 'Sarah Hassan',
            'specialties' => ['English'],
            'status' => 'active',
        ]);
        Sanctum::actingAs($owner);
        $slot = $this->postJson(
            "/api/v1/organizations/{$organization->id}/instructor-slots",
            [
                'instructorId' => $instructor->id,
                'startsAt' => now()->addDay()->toIso8601String(),
                'endsAt' => now()->addDay()->addHour()->toIso8601String(),
                'deliveryType' => 'online',
                'priceMinor' => 25000,
            ],
        )->assertCreated()->json('data');

        $student = User::factory()->create();
        Sanctum::actingAs($student);
        $lesson = $this->postJson('/api/v1/student/lesson-bookings', [
            'slotId' => $slot['id'],
            'subject' => '=English',
            'studentPhone' => '+201000000003',
        ])->assertCreated()->json('data');

        Sanctum::actingAs($owner);
        $session = $this->postJson(
            "/api/v1/organizations/{$organization->id}/learning-sessions",
            [
                'lessonBookingId' => $lesson['id'],
                'instructorId' => $instructor->id,
                'title' => 'Private English lesson',
                'startsAt' => $slot['starts_at'],
                'endsAt' => $slot['ends_at'],
            ],
        )->assertCreated()
            ->assertJsonPath('data.participantCount', 1)
            ->json('data.session');

        $this->getJson(
            "/api/v1/organizations/{$organization->id}/learning-sessions/{$session['id']}/attendance",
        )->assertOk()
            ->assertJsonPath('data.participants.0.student.id', $student->id);

        $lessonExport = $this->get(
            "/api/v1/organizations/{$organization->id}/reports/bookings?format=csv&kind=lessons",
        );
        $lessonExport->assertOk()
            ->assertHeader('content-type', 'text/csv; charset=UTF-8');
        $lessonContent = $lessonExport->streamedContent();
        $this->assertStringContainsString($student->name, $lessonContent);
        $this->assertStringContainsString('Sarah Hassan', $lessonContent);
        $this->assertStringContainsString('+201000000003', $lessonContent);
        $this->assertStringContainsString("'=English", $lessonContent);
    }

    /**
     * @return array{Organization, User, Course|null, CourseBatch|null}
     */
    private function academy(): array
    {
        $this->seed();
        $owner = User::factory()->create();
        $organization = Organization::query()->create([
            'name' => 'Attendance Academy',
            'slug' => 'attendance-academy-'.str()->random(6),
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
            'slug' => 'attendance-academy-'.str()->random(6),
            'public_name' => 'Attendance Academy',
            'description' => 'Attendance testing academy.',
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
            'start_date' => now()->toDateString(),
            'end_date' => now()->addMonths(2)->toDateString(),
            'schedule' => [],
            'delivery_type' => 'online',
            'capacity' => 20,
            'status' => BatchStatus::Open,
        ]);

        return [$organization, $owner, $course, $batch];
    }
}
