<?php

namespace Tests\Feature;

use App\Domain\Marketplace\Enums\BatchStatus;
use App\Domain\Marketplace\Enums\CourseStatus;
use App\Domain\Tenancy\Enums\OrganizationRole;
use App\Models\Assignment;
use App\Models\Course;
use App\Models\CourseBatch;
use App\Models\CourseEnrollment;
use App\Models\Organization;
use App\Models\OrganizationInvitation;
use App\Models\OrganizationMembership;
use App\Models\OrganizationSubscription;
use App\Models\Plan;
use App\Models\Quiz;
use App\Models\Role;
use App\Models\Room;
use App\Models\RoomMembership;
use App\Models\User;
use Database\Seeders\AuthorizationSeeder;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GoldenEndToEndWorkflowTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Executes the authoritative 22-step Golden SaaS Lifecycle + Cross-Tenant Denial.
     */
    public function test_complete_golden_educational_lifecycle_and_cross_tenant_isolation(): void
    {
        $this->seed(PlanSeeder::class);
        $this->seed(AuthorizationSeeder::class);

        // =========================================================================
        // STEP 1 & 2: Organization Registration & Owner Login
        // =========================================================================
        $owner = User::factory()->create([
            'name' => 'Dr. Ahmed Academy Owner',
            'email' => 'owner@academya.edu',
        ]);

        $academyA = Organization::query()->create([
            'name' => 'Academy Alpha STEM',
            'slug' => 'academy-alpha-stem',
            'type' => 'academy',
            'status' => 'active',
        ]);

        $ownerRole = Role::query()->where('name', OrganizationRole::Owner->value)->firstOrFail();
        OrganizationMembership::query()->create([
            'organization_id' => $academyA->id,
            'user_id' => $owner->id,
            'role_id' => $ownerRole->id,
            'status' => 'active',
            'joined_at' => now(),
        ]);

        $plan = Plan::query()->where('code', 'growth')->firstOrFail();
        OrganizationSubscription::query()->create([
            'organization_id' => $academyA->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'billing_interval' => 'monthly',
            'starts_at' => now(),
            'current_period_starts_at' => now(),
            'current_period_ends_at' => now()->addMonth(),
        ]);

        Sanctum::actingAs($owner);
        $this->getJson("/api/v1/organizations/{$academyA->id}/context")
            ->assertOk()
            ->assertJsonPath('data.organization.id', $academyA->id);

        // =========================================================================
        // STEP 3 & 4: Staff / Instructor Invitation & Acceptance
        // =========================================================================
        $instructorUser = User::factory()->create([
            'name' => 'Prof. Mona Instructor',
            'email' => 'mona.instructor@academya.edu',
        ]);
        $instructorRole = Role::query()->where('name', OrganizationRole::Instructor->value)->firstOrFail();

        $invitation = OrganizationInvitation::query()->create([
            'organization_id' => $academyA->id,
            'invited_by' => $owner->id,
            'email' => $instructorUser->email,
            'role_id' => $instructorRole->id,
            'token' => Str::random(40),
            'status' => 'pending',
            'expires_at' => now()->addDays(7),
        ]);

        // Instructor accepts invitation
        Sanctum::actingAs($instructorUser);
        $acceptRes = $this->postJson("/api/v1/invitations/{$invitation->token}/accept")
            ->assertOk();

        $this->assertDatabaseHas('organization_memberships', [
            'organization_id' => $academyA->id,
            'user_id' => $instructorUser->id,
            'role_id' => $instructorRole->id,
            'status' => 'active',
        ]);

        // =========================================================================
        // STEP 5, 6, 7 & 8: Course, Batch, Room Creation & Publishing
        // =========================================================================
        Sanctum::actingAs($owner);

        // Step 7: Create Room
        $room = Room::query()->create([
            'organization_id' => $academyA->id,
            'created_by' => $owner->id,
            'name' => 'Python Web Full-Stack Room',
            'slug' => 'python-web-fullstack-room',
            'status' => 'active',
            'access_type' => 'read_only',
        ]);

        // Step 5: Create Course
        $course = Course::query()->create([
            'organization_id' => $academyA->id,
            'title' => 'Python Full Stack Mastery',
            'title_ar' => 'احتراف بايثون المتكامل',
            'slug' => 'python-full-stack-mastery-'.Str::random(6),
            'description' => 'Comprehensive masterclass on modern backend development.',
            'status' => CourseStatus::Published,
            'published_at' => now(),
            'is_featured' => true,
        ]);

        // Step 6: Create Batch
        $batch = CourseBatch::query()->create([
            'organization_id' => $academyA->id,
            'course_id' => $course->id,
            'room_id' => $room->id,
            'name' => 'Cohort 2026-Q4',
            'capacity' => 25,
            'reserved_seats' => 0,
            'confirmed_seats' => 0,
            'status' => BatchStatus::Active,
            'starts_at' => now(),
            'ends_at' => now()->addMonths(3),
        ]);

        // Step 8: Public marketplace displays the published course
        $this->app['auth']->forgetGuards();
        $this->getJson("/api/v1/public/courses/{$course->slug}")
            ->assertOk()
            ->assertJsonPath('data.id', $course->id);

        // =========================================================================
        // STEP 9: Student Registers
        // =========================================================================
        $student = User::factory()->create([
            'name' => 'Ziad Student',
            'email' => 'ziad.student@example.com',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        // =========================================================================
        // STEP 10: Student Books Course
        // =========================================================================
        Sanctum::actingAs($student);
        $bookingRes = $this->postJson('/api/v1/public/bookings', [
            'courseId' => $course->id,
            'batchId' => $batch->id,
            'studentName' => $student->name,
            'email' => $student->email,
            'phone' => '+201012345678',
            'termsAccepted' => true,
            'idempotencyKey' => 'golden-flow-booking-'.Str::random(8),
        ])->assertCreated();

        $bookingId = $bookingRes->json('data.booking.id');
        $this->assertNotEmpty($bookingId);

        // =========================================================================
        // STEP 11 & 12: Academy Approves Booking & Activates Enrollment
        // =========================================================================
        Sanctum::actingAs($owner);
        $this->postJson("/api/v1/organizations/{$academyA->id}/bookings/{$bookingId}/confirm", [
            'markAsPaid' => true,
        ])->assertOk();

        // =========================================================================
        // STEP 13: Student Becomes Enrolled with Atomic Access
        // =========================================================================
        $this->assertDatabaseHas('course_enrollments', [
            'organization_id' => $academyA->id,
            'course_id' => $course->id,
            'student_id' => $student->id,
        ]);
        $this->assertDatabaseHas('room_memberships', [
            'room_id' => $room->id,
            'user_id' => $student->id,
            'status' => 'active',
        ]);
        $this->assertDatabaseHas('student_subscriptions', [
            'organization_id' => $academyA->id,
            'student_id' => $student->id,
            'status' => 'active',
        ]);

        // =========================================================================
        // STEP 14: Student Enters Room
        // =========================================================================
        Sanctum::actingAs($student);
        $this->getJson("/api/v1/organizations/{$academyA->id}/rooms/{$room->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $room->id);

        // =========================================================================
        // STEP 15: Session Attendance (Instructor Records Attendance)
        // =========================================================================
        Sanctum::actingAs($owner);
        $sessionRes = $this->postJson("/api/v1/organizations/{$academyA->id}/learning-sessions", [
            'batchId' => $batch->id,
            'title' => 'Core Architecture & APIs',
            'startsAt' => now()->subHour()->toIso8601String(),
            'endsAt' => now()->toIso8601String(),
        ])->assertCreated();

        $sessionId = $sessionRes->json('data.session.id');

        $this->putJson("/api/v1/organizations/{$academyA->id}/learning-sessions/{$sessionId}/attendance", [
            'records' => [[
                'studentId' => $student->id,
                'status' => 'present',
                'instructorNote' => 'Participated actively in session.',
            ]],
        ])->assertOk();

        $this->assertDatabaseHas('learning_session_attendances', [
            'session_id' => $sessionId,
            'student_id' => $student->id,
            'status' => 'present',
        ]);

        // =========================================================================
        // STEP 16 & 17: Assignments Workflow (Creation, Submission & Grading)
        // =========================================================================
        $assignment = Assignment::query()->create([
            'organization_id' => $academyA->id,
            'title' => 'Build a RESTful Microservice',
            'title_ar' => 'بناء خدمة ويب متكاملة',
            'max_score' => 100,
            'due_at' => now()->addDays(5),
            'status' => 'published',
        ]);

        Sanctum::actingAs($student);
        $submissionRes = $this->postJson("/api/v1/student/assignments/{$assignment->id}/submit", [
            'submissionText' => 'Completed microservice implementation repository.',
            'fileName' => 'microservice.zip',
        ])->assertOk();

        $submissionId = $submissionRes->json('data.id');

        Sanctum::actingAs($owner);
        $this->postJson("/api/v1/organizations/{$academyA->id}/assignments/{$assignment->id}/submissions/{$submissionId}/grade", [
            'score' => 96,
            'feedback' => 'Exceptional test coverage and error handling.',
        ])->assertOk();

        // =========================================================================
        // STEP 18: Quizzes Workflow (Creation, Submission & Auto-Grading)
        // =========================================================================
        $quiz = Quiz::query()->create([
            'organization_id' => $academyA->id,
            'title' => 'Python OOP Assessment',
            'title_ar' => 'اختبار البرمجة الكائنية في بايثون',
            'duration_minutes' => 20,
            'passing_score' => 70,
            'max_attempts' => 2,
            'status' => 'published',
        ]);

        $q1 = $quiz->questions()->create([
            'question_text' => 'Which keyword defines an inherited class in Python?',
            'type' => 'mcq',
            'points' => 10,
            'options' => [
                ['key' => 'A', 'text' => 'class Derived(Base):'],
                ['key' => 'B', 'text' => 'class Derived extends Base:'],
            ],
            'correct_answer' => 'A',
            'order' => 1,
        ]);

        Sanctum::actingAs($student);
        $attemptRes = $this->postJson("/api/v1/student/quizzes/{$quiz->id}/attempt", [
            'answers' => [$q1->id => 'A'],
        ])->assertOk();

        $this->assertTrue($attemptRes->json('data.passed'));
        $this->assertEquals(10, $attemptRes->json('data.score'));

        // =========================================================================
        // STEP 19 & 20: Learning Progress & Course Completion
        // =========================================================================
        $progressRes = $this->postJson('/api/v1/video/progress', [
            'contentId' => $course->id,
            'watchedSeconds' => 600,
            'totalDurationSeconds' => 600,
            'lastPositionSeconds' => 600,
        ])->assertOk();

        $this->assertEquals(100, $progressRes->json('data.completionPercentage'));
        $this->assertTrue($progressRes->json('data.isCompleted'));

        // =========================================================================
        // STEP 21: Certificate Generation
        // =========================================================================
        Sanctum::actingAs($owner);
        $certRes = $this->postJson("/api/v1/organizations/{$academyA->id}/certificates", [
            'courseId' => $course->id,
            'studentId' => $student->id,
            'gradeScore' => 97,
            'notes' => 'Graduated with high distinction in Python Web Development.',
        ])->assertCreated();

        $verificationCode = $certRes->json('data.verification_code');
        $this->assertNotEmpty($verificationCode);

        // Verify CourseEnrollment was updated to completed
        $this->assertDatabaseHas('course_enrollments', [
            'organization_id' => $academyA->id,
            'course_id' => $course->id,
            'student_id' => $student->id,
            'status' => 'completed',
        ]);

        // =========================================================================
        // STEP 22: Public Certificate Verification (QR-scan scenario)
        // =========================================================================
        $this->app['auth']->forgetGuards();
        $verifyRes = $this->getJson("/api/v1/public/certificates/verify/{$verificationCode}")
            ->assertOk()
            ->assertJson([
                'valid' => true,
                'certificate' => [
                    'verificationCode' => $verificationCode,
                    'gradeScore' => 97,
                    'studentName' => $student->name,
                ],
            ]);

        // =========================================================================
        // STEP 23: Tenant Isolation Verification (Academy B Denial)
        // =========================================================================
        $academyB = Organization::query()->create([
            'name' => 'Academy Beta Robotics',
            'slug' => 'academy-beta-robotics',
            'type' => 'academy',
            'status' => 'active',
        ]);

        $roomB = Room::query()->create([
            'organization_id' => $academyB->id,
            'created_by' => $owner->id,
            'name' => 'Robotics Secret Lab',
            'slug' => 'robotics-secret-lab',
            'status' => 'active',
            'access_type' => 'read_only',
        ]);

        // Student from Academy A attempts to access Academy B's context or room
        Sanctum::actingAs($student);
        $this->getJson("/api/v1/organizations/{$academyB->id}/context")
            ->assertForbidden()
            ->assertJsonPath('error.code', 'TENANT_ACCESS_DENIED');

        $this->getJson("/api/v1/organizations/{$academyB->id}/rooms/{$roomB->id}")
            ->assertForbidden()
            ->assertJsonPath('error.code', 'TENANT_ACCESS_DENIED');
    }
}
