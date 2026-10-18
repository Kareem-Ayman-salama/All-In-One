<?php

namespace Tests\Feature;

use App\Domain\Marketplace\Enums\BatchStatus;
use App\Domain\Marketplace\Enums\CourseStatus;
use App\Domain\Tenancy\Enums\OrganizationRole;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
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
use App\Models\QuizAttempt;
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

class CourseCompletionAndCertificateEligibilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_certificate_issuance_is_strictly_rejected_if_enrollment_is_not_completed(): void
    {
        $this->seed(PlanSeeder::class);
        $this->seed(AuthorizationSeeder::class);

        [$org, $admin, $course, $batch, $student, $enrollment] = $this->setupActiveEnrollment();

        Sanctum::actingAs($admin);

        // Enrollment is currently 'active' (not completed)
        $this->assertSame('active', $enrollment->status);

        // Attempting to generate a certificate MUST FAIL with 422
        $response = $this->postJson("/api/v1/organizations/{$org->id}/certificates", [
            'courseId' => $course->id,
            'studentId' => $student->id,
            'gradeScore' => 95,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('error.code', 'COURSE_NOT_COMPLETED');

        // Crucial invariant: Certificate generation MUST NOT silently mutate enrollment status!
        $enrollment->refresh();
        $this->assertSame('active', $enrollment->status);
    }

    public function test_certificate_issuance_is_rejected_if_student_has_no_enrollment(): void
    {
        $this->seed(PlanSeeder::class);
        $this->seed(AuthorizationSeeder::class);

        [$org, $admin, $course] = $this->setupCourseAndAdmin();
        $unrelatedStudent = User::factory()->create();

        Sanctum::actingAs($admin);

        $response = $this->postJson("/api/v1/organizations/{$org->id}/certificates", [
            'courseId' => $course->id,
            'studentId' => $unrelatedStudent->id,
            'gradeScore' => 90,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('error.code', 'ENROLLMENT_NOT_FOUND');
    }

    public function test_student_cannot_self_issue_certificate(): void
    {
        $this->seed(PlanSeeder::class);
        $this->seed(AuthorizationSeeder::class);

        [$org, , $course, , $student, $enrollment] = $this->setupActiveEnrollment();
        $enrollment->update(['status' => 'completed']);

        // Student tries to call the certificate generation API directly
        Sanctum::actingAs($student);

        $this->postJson("/api/v1/organizations/{$org->id}/certificates", [
            'courseId' => $course->id,
            'studentId' => $student->id,
            'gradeScore' => 100,
        ])->assertForbidden();
    }

    public function test_completion_engine_validates_milestones_and_unlocks_certificate(): void
    {
        $this->seed(PlanSeeder::class);
        $this->seed(AuthorizationSeeder::class);

        [$org, $admin, $course, $batch, $student, $enrollment, $room] = $this->setupActiveEnrollmentWithRoom();

        /** @var CourseCompletionService $completionService */
        $completionService = app(CourseCompletionService::class);

        // 1. Add required quiz
        $quiz = Quiz::query()->create([
            'organization_id' => $org->id,
            'created_by' => $admin->id,
            'title' => 'Required Architecture Quiz',
            'duration_minutes' => 15,
            'passing_score' => 60,
            'is_published' => true,
        ]);

        // Evaluate: quiz not passed yet -> eligible: false
        $eval1 = $completionService->evaluate($enrollment);
        $this->assertFalse($eval1['eligible']);
        $this->assertContains("Required quiz not passed: 'Required Architecture Quiz'.", $eval1['reasons']);
        $this->assertSame('active', $enrollment->fresh()->status);

        // 2. Student passes quiz
        QuizAttempt::query()->create([
            'organization_id' => $org->id,
            'quiz_id' => $quiz->id,
            'student_id' => $student->id,
            'score' => 80,
            'total_points' => 100,
            'percentage' => 80,
            'passed' => true,
            'answers' => [],
            'started_at' => now()->subMinutes(10),
            'completed_at' => now(),
        ]);

        // 3. Add required assignment
        $assignment = Assignment::query()->create([
            'organization_id' => $org->id,
            'created_by' => $admin->id,
            'title' => 'Final Capstone Project',
            'max_score' => 100,
            'status' => 'published',
        ]);

        // Evaluate: assignment not submitted yet -> eligible: false
        $eval2 = $completionService->evaluate($enrollment);
        $this->assertFalse($eval2['eligible']);
        $this->assertContains("Required assignment not submitted: 'Final Capstone Project'.", $eval2['reasons']);

        // 4. Student submits assignment
        AssignmentSubmission::query()->create([
            'organization_id' => $org->id,
            'assignment_id' => $assignment->id,
            'student_id' => $student->id,
            'submitted_at' => now(),
            'status' => 'submitted',
        ]);

        // 5. Add attendance requirement
        $session = LearningSession::query()->create([
            'organization_id' => $org->id,
            'created_by' => $admin->id,
            'batch_id' => $batch->id,
            'title' => 'Live Capstone Defense',
            'starts_at' => now()->subHour(),
            'ends_at' => now(),
            'status' => 'completed',
        ]);

        // Evaluate before attendance: rate is 0% -> eligible: false
        $eval3 = $completionService->evaluate($enrollment);
        $this->assertFalse($eval3['eligible']);

        // Student marks attendance as present
        AttendanceRecord::query()->create([
            'organization_id' => $org->id,
            'session_id' => $session->id,
            'student_id' => $student->id,
            'marked_by' => $admin->id,
            'marked_at' => now(),
            'status' => 'present',
        ]);

        // 6. Now all requirements are satisfied -> evaluate completes the enrollment!
        $evalFinal = $completionService->evaluate($enrollment);
        $this->assertTrue($evalFinal['eligible']);
        $this->assertTrue($evalFinal['completed']);
        $this->assertEmpty($evalFinal['reasons']);

        // Database confirms enrollment is now authoritatively completed
        $this->assertSame('completed', $enrollment->fresh()->status);

        // 7. Now certificate issuance succeeds!
        Sanctum::actingAs($admin);
        $certRes = $this->postJson("/api/v1/organizations/{$org->id}/certificates", [
            'courseId' => $course->id,
            'studentId' => $student->id,
            'gradeScore' => 96,
        ])->assertCreated();

        $this->assertNotEmpty($certRes->json('data.verification_code'));
    }

    private function setupCourseAndAdmin(): array
    {
        $org = Organization::query()->create(['name' => 'Ain Academy', 'slug' => 'ain-academy-'.Str::random(6), 'type' => 'academy', 'status' => 'active']);
        $admin = User::factory()->create();
        $ownerRole = Role::query()->where('name', OrganizationRole::Owner->value)->firstOrFail();
        OrganizationMembership::query()->create([
            'organization_id' => $org->id,
            'user_id' => $admin->id,
            'role_id' => $ownerRole->id,
            'status' => 'active',
            'joined_at' => now(),
        ]);
        $plan = Plan::query()->where('code', 'growth')->firstOrFail();
        OrganizationSubscription::query()->create([
            'organization_id' => $org->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'billing_interval' => 'monthly',
            'starts_at' => now(),
            'current_period_starts_at' => now(),
            'current_period_ends_at' => now()->addMonth(),
        ]);
        $course = Course::query()->create([
            'organization_id' => $org->id,
            'created_by' => $admin->id,
            'title' => 'Software Engineering',
            'slug' => 'software-eng-'.Str::random(6),
            'status' => CourseStatus::Published,
            'published_at' => now(),
        ]);

        return [$org, $admin, $course];
    }

    private function setupActiveEnrollment(): array
    {
        [$org, $admin, $course] = $this->setupCourseAndAdmin();
        $room = Room::query()->create([
            'organization_id' => $org->id,
            'created_by' => $admin->id,
            'name' => 'Main Room',
            'slug' => 'main-room-'.Str::random(6),
            'status' => 'active',
        ]);
        $batch = CourseBatch::query()->create([
            'organization_id' => $org->id,
            'course_id' => $course->id,
            'room_id' => $room->id,
            'title' => 'Batch Q1',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addMonths(2)->toDateString(),
            'schedule' => [['day' => 'Monday', 'startTime' => '10:00', 'endTime' => '12:00']],
            'capacity' => 20,
            'status' => BatchStatus::Open,
        ]);
        $student = User::factory()->create(['name' => 'Active Learner']);
        $booking = Booking::query()->create([
            'organization_id' => $org->id,
            'course_id' => $course->id,
            'batch_id' => $batch->id,
            'student_id' => $student->id,
            'student_name' => $student->name,
            'email' => $student->email,
            'phone' => '+201000000000',
            'terms_accepted' => true,
            'amount_minor' => 150000,
            'currency' => 'EGP',
            'status' => 'confirmed',
            'payment_status' => 'paid',
        ]);
        $enrollment = CourseEnrollment::query()->create([
            'organization_id' => $org->id,
            'course_id' => $course->id,
            'batch_id' => $batch->id,
            'booking_id' => $booking->id,
            'student_id' => $student->id,
            'status' => 'active',
            'access_starts_at' => now(),
            'access_ends_at' => now()->addMonths(2),
        ]);

        return [$org, $admin, $course, $batch, $student, $enrollment];
    }

    private function setupActiveEnrollmentWithRoom(): array
    {
        [$org, $admin, $course] = $this->setupCourseAndAdmin();
        $room = Room::query()->create([
            'organization_id' => $org->id,
            'created_by' => $admin->id,
            'name' => 'Engineering Room',
            'slug' => 'engineering-room-'.Str::random(6),
            'status' => 'active',
        ]);
        $batch = CourseBatch::query()->create([
            'organization_id' => $org->id,
            'course_id' => $course->id,
            'room_id' => $room->id,
            'title' => 'Cohort Alpha',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addMonths(2)->toDateString(),
            'schedule' => [['day' => 'Monday', 'startTime' => '10:00', 'endTime' => '12:00']],
            'capacity' => 20,
            'status' => BatchStatus::Open,
        ]);
        $student = User::factory()->create(['name' => 'Eligible Student']);
        $booking = Booking::query()->create([
            'organization_id' => $org->id,
            'course_id' => $course->id,
            'batch_id' => $batch->id,
            'student_id' => $student->id,
            'student_name' => $student->name,
            'email' => $student->email,
            'phone' => '+201000000000',
            'terms_accepted' => true,
            'amount_minor' => 150000,
            'currency' => 'EGP',
            'status' => 'confirmed',
            'payment_status' => 'paid',
        ]);
        $enrollment = CourseEnrollment::query()->create([
            'organization_id' => $org->id,
            'course_id' => $course->id,
            'batch_id' => $batch->id,
            'booking_id' => $booking->id,
            'student_id' => $student->id,
            'status' => 'active',
            'access_starts_at' => now(),
            'access_ends_at' => now()->addMonths(2),
        ]);

        return [$org, $admin, $course, $batch, $student, $enrollment, $room];
    }
}
