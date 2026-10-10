<?php

namespace Tests\Feature;

use App\Domain\Tenancy\Enums\OrganizationRole;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\GuardianStudentLink;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\OrganizationSubscription;
use App\Models\Plan;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GuardianProgressAndCrmTest extends TestCase
{
    use RefreshDatabase;

    public function test_guardian_can_view_child_assignments_and_quizzes_progress(): void
    {
        $this->seed();
        [$org, $admin] = $this->workspace('Apex Academy');

        // Create student and guardian
        $student = User::factory()->create(['name' => 'Kareem Ahmed', 'email' => 'kareem@student.com']);
        $guardian = User::factory()->create(['name' => 'Ahmed Mohamed', 'email' => 'ahmed.guardian@family.com']);

        // Link student and guardian
        GuardianStudentLink::query()->create([
            'organization_id' => $org->id,
            'guardian_id' => $guardian->id,
            'student_id' => $student->id,
            'status' => 'active',
            'relationship' => 'father',
        ]);

        // Create assignment and submission
        $assignment = Assignment::query()->create([
            'organization_id' => $org->id,
            'title' => 'Biology Lab Report',
            'title_ar' => 'تقرير معمل الأحياء',
            'description' => 'Submit complete microscopy findings',
            'due_at' => now()->addDays(5),
            'max_score' => 50,
            'created_by' => $admin->id,
        ]);

        AssignmentSubmission::query()->create([
            'organization_id' => $org->id,
            'assignment_id' => $assignment->id,
            'student_id' => $student->id,
            'submission_text' => 'Microscopy experiment completed successfully.',
            'attachment_url' => 'https://files.aio.test/lab-report.pdf',
            'status' => 'graded',
            'score' => 48.5,
            'feedback' => 'Excellent scientific methodology and observations.',
            'submitted_at' => now()->subDay(),
            'graded_by' => $admin->id,
            'graded_at' => now(),
        ]);

        // Create quiz and attempt
        $quiz = Quiz::query()->create([
            'organization_id' => $org->id,
            'title' => 'Cell Structure Quiz',
            'title_ar' => 'اختبار بنية الخلية',
            'duration_minutes' => 20,
            'passing_score' => 70,
            'max_attempts' => 2,
            'is_published' => true,
            'created_by' => $admin->id,
        ]);

        QuizAttempt::query()->create([
            'quiz_id' => $quiz->id,
            'student_id' => $student->id,
            'organization_id' => $org->id,
            'score' => 18,
            'total_points' => 20,
            'percentage' => 90.0,
            'is_passed' => true,
            'answers' => ['q1' => 'opt_1'],
            'started_at' => now()->subMinutes(15),
            'completed_at' => now()->subMinutes(5),
        ]);

        // Act as Guardian
        Sanctum::actingAs($guardian);

        // 1. Guardian views child assignments
        $assignRes = $this->getJson("/api/v1/guardian/students/{$student->id}/assignments")
            ->assertOk();
        $this->assertCount(1, $assignRes->json('data.submissions'));
        $this->assertEquals(48.5, $assignRes->json('data.submissions.0.score'));
        $this->assertEquals('graded', $assignRes->json('data.submissions.0.status'));

        // 2. Guardian views child quizzes
        $quizRes = $this->getJson("/api/v1/guardian/students/{$student->id}/quizzes")
            ->assertOk();
        $this->assertCount(1, $quizRes->json('data.attempts'));
        $this->assertEquals(90.0, $quizRes->json('data.attempts.0.percentage'));
        $this->assertTrue($quizRes->json('data.attempts.0.is_passed'));
    }

    public function test_organization_can_manage_crm_leads_lifecycle_and_conversion(): void
    {
        $this->seed();
        [$org, $admin] = $this->workspace('Future Training Group');

        Sanctum::actingAs($admin);

        // 1. Store a new prospective lead
        $createRes = $this->postJson("/api/v1/organizations/{$org->id}/crm/leads", [
            'name' => 'Omar Mostafa',
            'email' => 'omar.lead@target.com',
            'phone' => '+201009988776',
            'subject' => 'Interested in Full-Stack Bootcamp',
            'notes' => 'Contacted via WhatsApp, prefers weekend batch.',
            'priority' => 'high',
            'status' => 'lead',
        ])->assertCreated();

        $leadId = $createRes->json('data.id');
        $this->assertDatabaseHas('support_requests', [
            'id' => $leadId,
            'organization_id' => $org->id,
            'name' => 'Omar Mostafa',
            'status' => 'lead',
        ]);

        // 2. Update lead stage to 'contacted'
        $this->patchJson("/api/v1/organizations/{$org->id}/crm/leads/{$leadId}", [
            'status' => 'contacted',
            'notes' => 'Call answered, sent batch details & syllabus.',
        ])->assertOk();

        $this->assertDatabaseHas('support_requests', [
            'id' => $leadId,
            'status' => 'contacted',
        ]);

        // 3. Convert lead to enrolled student
        $convertRes = $this->postJson("/api/v1/organizations/{$org->id}/crm/leads/{$leadId}/convert")
            ->assertOk();

        $this->assertEquals('enrolled', $convertRes->json('data.lead.status'));
        $this->assertDatabaseHas('support_requests', [
            'id' => $leadId,
            'status' => 'enrolled',
        ]);
    }

    public function test_crm_lead_cannot_be_updated_or_converted_by_another_organization(): void
    {
        $this->seed();
        [$orgA, $adminA] = $this->workspace('Organization Alpha');
        [$orgB, $adminB] = $this->workspace('Organization Beta');

        // Create lead in Org A
        Sanctum::actingAs($adminA);
        $createRes = $this->postJson("/api/v1/organizations/{$orgA->id}/crm/leads", [
            'name' => 'Sara Lead',
            'email' => 'sara@target.com',
            'subject' => 'Org A Inquiry',
            'priority' => 'normal',
        ])->assertCreated();

        $leadId = $createRes->json('data.id');

        // Try to update Org A's lead using Org B credentials and Org B's route
        Sanctum::actingAs($adminB);
        $this->patchJson("/api/v1/organizations/{$orgB->id}/crm/leads/{$leadId}", [
            'status' => 'contacted',
        ])->assertNotFound();

        // Try to convert Org A's lead using Org B credentials and Org B's route
        $this->postJson("/api/v1/organizations/{$orgB->id}/crm/leads/{$leadId}/convert")
            ->assertNotFound();
    }

    /**
     * @return array{0: Organization, 1: User}
     */
    private function workspace(string $name): array
    {
        $plan = Plan::query()->where('active', true)->first()
            ?? Plan::factory()->create(['active' => true]);

        $ownerRole = Role::query()->where('name', OrganizationRole::Owner->value)->first()
            ?? Role::factory()->create([
                'name' => OrganizationRole::Owner->value,
                'organization_id' => null,
            ]);

        $user = User::factory()->create();
        $org = Organization::factory()->create(['name' => $name]);

        OrganizationMembership::query()->create([
            'organization_id' => $org->id,
            'user_id' => $user->id,
            'role_id' => $ownerRole->id,
            'status' => 'active',
            'joined_at' => now(),
        ]);

        OrganizationSubscription::query()->create([
            'organization_id' => $org->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'starts_at' => now(),
            'current_period_starts_at' => now(),
            'current_period_ends_at' => now()->addMonth(),
        ]);

        return [$org, $user];
    }
}
