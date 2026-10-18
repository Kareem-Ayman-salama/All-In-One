<?php

namespace Tests\Feature;

use App\Domain\Marketplace\Enums\BatchStatus;
use App\Domain\Marketplace\Enums\CourseStatus;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\AttendanceRecord;
use App\Models\Certificate;
use App\Models\ContentItem;
use App\Models\Course;
use App\Models\CourseBatch;
use App\Models\CourseEnrollment;
use App\Models\Instructor;
use App\Models\LearningSession;
use App\Models\Organization;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\Room;
use App\Models\User;
use App\Models\VideoWatchProgress;
use App\Services\Courses\CourseCompletionService;
use Database\Seeders\AuthorizationSeeder;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PilotAcademyWorkflowTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Executes the authoritative Pilot Academy Onboarding, Learning Lifecycle,
     * Policy Resolution, Certificate Privacy/Revocation, and Multi-Tenant Isolation suite.
     */
    public function test_complete_pilot_academy_workflow(): void
    {
        $this->seed(PlanSeeder::class);
        $this->seed(AuthorizationSeeder::class);

        // =========================================================================
        // 1. Super Admin Provisions Pilot Academy via Authoritative Endpoint
        // =========================================================================
        $superAdmin = User::factory()->create([
            'name' => 'Platform Super Admin',
            'email' => 'superadmin@ain.platform',
            'platform_role' => 'super_admin',
        ]);

        Sanctum::actingAs($superAdmin);

        $provisionPayload = [
            'academyName' => 'Al-Rowad STEM Pilot Academy',
            'ownerName' => 'Eng. Tamer Owner',
            'ownerEmail' => 'tamer@alrowad.edu',
            'planCode' => 'pilot',
            'trialDays' => 30,
            'studentLimit' => 300,
            'roomLimit' => 15,
            'storageMb' => 10240,
        ];

        $provisionRes = $this->postJson('/api/v1/admin/pilot-academies', $provisionPayload)
            ->assertCreated();

        $orgId = $provisionRes->json('data.organization.id');
        $orgSlug = $provisionRes->json('data.organization.slug');
        $invitationToken = $provisionRes->json('data.invitationToken');

        $this->assertNotEmpty($orgId);
        $this->assertNotEmpty($invitationToken);
        $this->assertDatabaseHas('organizations', ['id' => $orgId, 'name' => 'Al-Rowad STEM Pilot Academy']);
        $this->assertDatabaseHas('academy_profiles', ['organization_id' => $orgId, 'verification_status' => 'verified']);
        $this->assertDatabaseHas('organization_subscriptions', ['organization_id' => $orgId, 'status' => 'active']);

        // =========================================================================
        // 2. Owner Accepts Invitation & Verifies Workspace Access
        // =========================================================================
        $owner = User::query()->where('email', 'tamer@alrowad.edu')->firstOrFail();
        Sanctum::actingAs($owner);

        $acceptRes = $this->postJson('/api/v1/invitations/accept', ['token' => $invitationToken])
            ->assertOk();
        $this->assertSame($orgId, $acceptRes->json('data.organization.id'));

        $this->getJson("/api/v1/organizations/{$orgId}/context")
            ->assertOk()
            ->assertJsonPath('data.organization.id', $orgId);

        // =========================================================================
        // 3. Create Instructor and Room
        // =========================================================================
        $instructor = Instructor::query()->create([
            'organization_id' => $orgId,
            'user_id' => $owner->id,
            'name' => 'Dr. Kareem Robotics',
            'name_ar' => 'د. كريم روبوتكس',
            'status' => 'active',
        ]);

        $room = Room::query()->create([
            'organization_id' => $orgId,
            'created_by' => $owner->id,
            'name' => 'Robotics Core Lab',
            'slug' => 'robotics-core-lab-'.Str::random(6),
            'status' => 'active',
            'access_type' => 'read_only',
        ]);

        // =========================================================================
        // 4. Create Course with Custom Configurable Completion Policy
        // =========================================================================
        $customPolicy = [
            'require_lessons_completion' => true,
            'minimum_lesson_completion_percentage' => 90,
            'require_assignments' => true,
            'require_all_required_assignments' => true,
            'require_quizzes' => true,
            'minimum_quiz_score' => 75,
            'require_attendance' => true,
            'minimum_attendance_percentage' => 80,
            'certificate_enabled' => true,
        ];

        $courseRes = $this->postJson("/api/v1/organizations/{$orgId}/courses", [
            'instructorId' => $instructor->id,
            'title' => 'Advanced Robotics Systems',
            'titleAr' => 'أنظمة الروبوتات المتقدمة',
            'shortDescriptionAr' => 'كورس تدريبي مكثف على برمجة الروبوتات والأنظمة المدمجة.',
            'description' => 'Comprehensive masterclass on embedded hardware and robotics.',
            'descriptionAr' => 'دورة تدريبية متكاملة لبرمجة الأنظمة المدمجة والروبوتات.',
            'deliveryType' => 'online',
            'priceMinor' => 250000,
            'currency' => 'EGP',
            'duration' => '10 weeks',
            'sessionsCount' => 12,
            'completionPolicy' => $customPolicy,
        ])->assertCreated();

        $courseId = $courseRes->json('data.id');
        $this->assertNotEmpty($courseId);

        // Verify completion policy endpoint returns resolved policy
        $policyRes = $this->getJson("/api/v1/organizations/{$orgId}/courses/{$courseId}/completion-policy")
            ->assertOk();
        $this->assertSame(90, $policyRes->json('data.resolvedPolicy.minimum_lesson_completion_percentage'));
        $this->assertSame(80, $policyRes->json('data.resolvedPolicy.minimum_attendance_percentage'));
        $this->assertSame(75, $policyRes->json('data.resolvedPolicy.minimum_quiz_score'));

        // =========================================================================
        // 5. Create Batch & Publish Course
        // =========================================================================
        $batch = CourseBatch::query()->create([
            'organization_id' => $orgId,
            'course_id' => $courseId,
            'room_id' => $room->id,
            'title' => 'Cohort Pilot Alpha',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addMonths(2)->toDateString(),
            'schedule' => [['day' => 'Wednesday', 'startTime' => '19:00', 'endTime' => '21:00']],
            'delivery_type' => 'online',
            'capacity' => 30,
            'reserved_seats' => 0,
            'confirmed_seats' => 0,
            'status' => BatchStatus::Open,
        ]);

        $course = Course::query()->findOrFail($courseId);
        $course->update([
            'status' => CourseStatus::Published,
            'published_at' => now(),
        ]);

        // =========================================================================
        // 6. Student Registration & Booking Flow
        // =========================================================================
        $student = User::factory()->create([
            'name' => 'Youssef Pilot Student',
            'email' => 'youssef.pilot@example.com',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        Sanctum::actingAs($student);
        $bookingRes = $this->postJson('/api/v1/public/bookings', [
            'courseId' => $courseId,
            'batchId' => $batch->id,
            'studentName' => $student->name,
            'email' => $student->email,
            'phone' => '+201099887766',
            'termsAccepted' => true,
            'idempotencyKey' => 'pilot-booking-'.Str::random(8),
        ])->assertCreated();

        $bookingId = $bookingRes->json('data.booking.id');
        $this->assertNotEmpty($bookingId);

        // Owner confirms booking and activates enrollment
        Sanctum::actingAs($owner);
        $this->postJson("/api/v1/organizations/{$orgId}/bookings/{$bookingId}/confirm", [
            'markAsPaid' => true,
        ])->assertOk();

        $enrollment = CourseEnrollment::query()->where([
            'organization_id' => $orgId,
            'course_id' => $courseId,
            'student_id' => $student->id,
        ])->firstOrFail();

        $this->assertSame('active', $enrollment->status);

        // =========================================================================
        // 7. Student Learning Lifecycle & Custom Policy Validation
        // =========================================================================
        // A. Video content with watch progress: 95% (satisfies >= 90%)
        $contentItem = ContentItem::query()->create([
            'organization_id' => $orgId,
            'room_id' => $room->id,
            'created_by' => $owner->id,
            'title' => 'Lesson 1: Introduction to Microcontrollers',
            'type' => 'video',
            'status' => 'published',
            'download_allowed' => false,
            'published_at' => now(),
        ]);

        VideoWatchProgress::query()->create([
            'organization_id' => $orgId,
            'student_id' => $student->id,
            'content_id' => $contentItem->id,
            'watched_seconds' => 3420,
            'completion_percentage' => 95,
            'is_completed' => true,
        ]);

        // B. Learning session with attendance: 100% (satisfies >= 80%)
        $session = LearningSession::query()->create([
            'organization_id' => $orgId,
            'batch_id' => $batch->id,
            'instructor_id' => $instructor->id,
            'created_by' => $owner->id,
            'title' => 'Live Lab Session 1',
            'starts_at' => now()->subDay(),
            'ends_at' => now()->subDay()->addHours(2),
            'status' => 'completed',
        ]);

        AttendanceRecord::query()->create([
            'organization_id' => $orgId,
            'session_id' => $session->id,
            'student_id' => $student->id,
            'status' => 'present',
            'marked_by' => $instructor->user_id,
            'marked_at' => now()->subDay(),
        ]);

        // C. Assignment submission
        $assignment = Assignment::query()->create([
            'organization_id' => $orgId,
            'course_id' => $courseId,
            'created_by' => $instructor->user_id,
            'title' => 'Lab 1 Assignment: GPIO Driver',
            'status' => 'published',
            'max_score' => 100,
        ]);

        AssignmentSubmission::query()->create([
            'organization_id' => $orgId,
            'assignment_id' => $assignment->id,
            'student_id' => $student->id,
            'status' => 'graded',
            'score' => 92,
            'submitted_at' => now()->subHours(6),
        ]);

        // D. Quiz submission with score: 85% (satisfies >= 75%)
        $quiz = Quiz::query()->create([
            'organization_id' => $orgId,
            'course_id' => $courseId,
            'created_by' => $instructor->user_id,
            'title' => 'Robotics Fundamentals Quiz',
            'is_published' => true,
            'duration_minutes' => 30,
            'passing_score' => 75,
        ]);

        QuizAttempt::query()->create([
            'organization_id' => $orgId,
            'quiz_id' => $quiz->id,
            'student_id' => $student->id,
            'score' => 85,
            'percentage' => 85,
            'passed' => true,
            'answers' => [],
            'started_at' => now()->subHours(5),
            'completed_at' => now()->subHours(4),
        ]);

        // =========================================================================
        // 8. Authoritative Completion Evaluation
        // =========================================================================
        /** @var CourseCompletionService $completionService */
        $completionService = app(CourseCompletionService::class);
        $eval = $completionService->evaluate($enrollment);

        $this->assertTrue($eval['eligible']);
        $this->assertTrue($eval['completed']);
        $this->assertSame('completed', $enrollment->fresh()->status);

        // =========================================================================
        // 9. Certificate Issuance, Privacy Controls, and Revocation
        // =========================================================================
        Sanctum::actingAs($owner);
        $certRes = $this->postJson("/api/v1/organizations/{$orgId}/certificates", [
            'courseId' => $courseId,
            'studentId' => $student->id,
            'gradeScore' => 92,
            'notes' => 'Completed Advanced Robotics Systems with excellence.',
        ])->assertCreated();

        $verificationCode = $certRes->json('data.verification_code');
        $certificateId = $certRes->json('data.id');
        $this->assertNotEmpty($verificationCode);

        // Public verification - Grade should be HIDDEN by default per privacy requirements
        $this->app['auth']->forgetGuards();
        $verifyRes = $this->getJson("/api/v1/public/certificates/verify/{$verificationCode}")
            ->assertOk()
            ->assertJson([
                'valid' => true,
                'status' => 'issued',
                'certificate' => [
                    'verificationCode' => $verificationCode,
                    'studentName' => $student->name,
                    'courseTitle' => $course->title_ar ?: $course->title,
                    'organizationName' => 'Al-Rowad STEM Pilot Academy',
                ],
            ]);

        // Assert grade is NOT present in default public response
        $this->assertArrayNotHasKey('gradeScore', $verifyRes->json('certificate'));

        // Owner revokes the certificate
        Sanctum::actingAs($owner);
        $this->postJson("/api/v1/organizations/{$orgId}/certificates/{$certificateId}/revoke", [
            'reason' => 'Administrative re-evaluation requested.',
        ])->assertOk();

        // Public verification after revocation
        $this->app['auth']->forgetGuards();
        $revokedVerifyRes = $this->getJson("/api/v1/public/certificates/verify/{$verificationCode}")
            ->assertOk()
            ->assertJson([
                'valid' => false,
                'status' => 'revoked',
                'message' => 'هذه الشهادة تم إلغاؤها / Certificate Revoked.',
                'certificate' => [
                    'verificationCode' => $verificationCode,
                    'status' => 'revoked',
                    'studentName' => $student->name,
                    'revocationReason' => 'Administrative re-evaluation requested.',
                ],
            ]);

        // =========================================================================
        // 10. Academy Setup Checklist Verification
        // =========================================================================
        Sanctum::actingAs($owner);
        $checklistRes = $this->getJson("/api/v1/academy-onboarding/wizard?organization_id={$orgId}")
            ->assertOk();

        $checklist = $checklistRes->json('data.checklist');
        $this->assertIsArray($checklist);
        $this->assertGreaterThanOrEqual(8, count($checklist));
        $this->assertGreaterThan(0, $checklistRes->json('data.progress_percent'));

        // =========================================================================
        // 11. Cross-Tenant Isolation Enforcement
        // =========================================================================
        $otherAcademy = Organization::query()->create([
            'name' => 'Competitor Robotics Academy',
            'slug' => 'competitor-robotics-academy',
            'type' => 'academy',
            'status' => 'active',
        ]);

        $otherRoom = Room::query()->create([
            'organization_id' => $otherAcademy->id,
            'created_by' => $superAdmin->id,
            'name' => 'Competitor Secret Room',
            'slug' => 'competitor-secret-room',
            'status' => 'active',
            'access_type' => 'read_only',
        ]);

        // Pilot student cannot access competitor's room or context
        Sanctum::actingAs($student);
        $this->getJson("/api/v1/organizations/{$otherAcademy->id}/context")
            ->assertForbidden()
            ->assertJsonPath('error.code', 'TENANT_ACCESS_DENIED');

        $this->getJson("/api/v1/organizations/{$otherAcademy->id}/rooms/{$otherRoom->id}")
            ->assertForbidden()
            ->assertJsonPath('error.code', 'TENANT_ACCESS_DENIED');
    }
}
