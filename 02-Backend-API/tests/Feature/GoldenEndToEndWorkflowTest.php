<?php

namespace Tests\Feature;

use App\Domain\Marketplace\Enums\BatchStatus;
use App\Domain\Marketplace\Enums\CourseStatus;
use App\Domain\Tenancy\Enums\OrganizationRole;
use App\Models\AcademyProfile;
use App\Models\Assignment;
use App\Models\AttendanceRecord;
use App\Models\Booking;
use App\Models\Course;
use App\Models\CourseBatch;
use App\Models\CourseEnrollment;
use App\Models\LearningSession;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\OrganizationSubscription;
use App\Models\Plan;
use App\Models\Quiz;
use App\Models\Role;
use App\Models\Room;
use App\Models\User;
use App\Services\Courses\CourseCompletionService;
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

        $academyProfileA = AcademyProfile::query()->create([
            'organization_id' => $academyA->id,
            'slug' => 'academy-alpha-stem',
            'public_name' => 'Academy Alpha STEM',
            'description' => 'A premier STEM academy.',
            'is_public' => true,
            'verification_status' => 'verified',
            'verified_at' => now(),
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
        $room = Room::query()->create([
            'organization_id' => $academyA->id,
            'created_by' => $owner->id,
            'name' => 'Python Web Full-Stack Room',
            'slug' => 'python-web-fullstack-room',
            'status' => 'active',
            'access_type' => 'read_only',
        ]);

        $inviteRes = $this->postJson("/api/v1/organizations/{$academyA->id}/invitations", [
            'email' => 'mona.instructor@academya.edu',
            'role' => OrganizationRole::Instructor->value,
            'roomIds' => [$room->id],
        ])->assertCreated();

        $token = $inviteRes->json('data.token');
        $this->assertNotEmpty($token);

        // Instructor accepts invitation
        $instructorUser = User::factory()->create([
            'name' => 'Prof. Mona Instructor',
            'email' => 'mona.instructor@academya.edu',
        ]);
        Sanctum::actingAs($instructorUser);
        $this->postJson('/api/v1/invitations/accept', ['token' => $token])
            ->assertOk()
            ->assertJsonPath('data.organization.id', $academyA->id)
            ->assertJsonPath('data.role', OrganizationRole::Instructor->value);

        $this->assertDatabaseHas('organization_memberships', [
            'organization_id' => $academyA->id,
            'user_id' => $instructorUser->id,
            'status' => 'active',
        ]);

        // =========================================================================
        // STEP 5, 6, 7 & 8: Course, Batch, Room Creation & Publishing
        // =========================================================================
        Sanctum::actingAs($owner);

        // Step 5: Create Course
        $course = Course::query()->create([
            'organization_id' => $academyA->id,
            'academy_profile_id' => $academyProfileA->id,
            'created_by' => $owner->id,
            'title' => 'Python Full Stack Mastery',
            'title_ar' => 'احتراف بايثون المتكامل',
            'slug' => 'python-full-stack-mastery-'.Str::random(6),
            'description' => 'Comprehensive masterclass on modern backend development.',
            'delivery_type' => 'online',
            'price_minor' => 150000,
            'currency' => 'EGP',
            'status' => CourseStatus::Published,
            'published_at' => now(),
            'is_featured' => true,
        ]);

        // Step 6: Create Batch
        $batch = CourseBatch::query()->create([
            'organization_id' => $academyA->id,
            'course_id' => $course->id,
            'room_id' => $room->id,
            'title' => 'Cohort 2026-Q4',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addMonths(3)->toDateString(),
            'schedule' => [['day' => 'Monday', 'startTime' => '18:00', 'endTime' => '20:00']],
            'delivery_type' => 'online',
            'capacity' => 25,
            'reserved_seats' => 0,
            'confirmed_seats' => 0,
            'status' => BatchStatus::Open,
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
        $enrollment = CourseEnrollment::query()->where([
            'organization_id' => $academyA->id,
            'course_id' => $course->id,
            'student_id' => $student->id,
        ])->firstOrFail();

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
        // STEP 15: Session Attendance
        // =========================================================================
        Sanctum::actingAs($owner);
        $session = LearningSession::query()->create([
            'organization_id' => $academyA->id,
            'created_by' => $owner->id,
            'batch_id' => $batch->id,
            'title' => 'Core Architecture & APIs',
            'starts_at' => now()->subHour(),
            'ends_at' => now(),
            'status' => 'completed',
        ]);

        AttendanceRecord::query()->create([
            'organization_id' => $academyA->id,
            'session_id' => $session->id,
            'student_id' => $student->id,
            'marked_by' => $owner->id,
            'marked_at' => now(),
            'status' => 'present',
        ]);

        $this->assertDatabaseHas('attendance_records', [
            'session_id' => $session->id,
            'student_id' => $student->id,
            'status' => 'present',
        ]);

        // =========================================================================
        // STEP 16 & 17: Assignments Workflow (Creation, Submission & Grading)
        // =========================================================================
        $assignment = Assignment::query()->create([
            'organization_id' => $academyA->id,
            'created_by' => $owner->id,
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
            'created_by' => $owner->id,
            'title' => 'Python OOP Assessment',
            'title_ar' => 'اختبار البرمجة الكائنية في بايثون',
            'duration_minutes' => 20,
            'passing_score' => 60,
            'max_attempts' => 2,
            'is_published' => true,
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
        ])->assertCreated();

        $this->assertTrue($attemptRes->json('data.passed'));

        // =========================================================================
        // STEP 19 & 20: Learning Progress & Authoritative Course Completion Engine
        // =========================================================================
        /** @var CourseCompletionService $completionEngine */
        $completionEngine = app(CourseCompletionService::class);
        $eval = $completionEngine->evaluate($enrollment);
        $this->assertTrue($eval['eligible']);
        $this->assertTrue($eval['completed']);
        $this->assertSame('completed', $enrollment->fresh()->status);

        // =========================================================================
        // STEP 21: Authorized Certificate Issuance (Requires Completed Enrollment)
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

        // =========================================================================
        // STEP 22: Public Certificate Verification (QR-scan scenario)
        // =========================================================================
        $academyA->update(['settings' => ['public_certificate_show_grade' => true]]);
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
