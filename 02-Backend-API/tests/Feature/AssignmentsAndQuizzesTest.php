<?php

namespace Tests\Feature;

use App\Domain\Tenancy\Enums\OrganizationRole;
use App\Models\Assignment;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\OrganizationSubscription;
use App\Models\Plan;
use App\Models\Quiz;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AssignmentsAndQuizzesTest extends TestCase
{
    use RefreshDatabase;

    public function test_assignment_lifecycle_and_tenant_scoping(): void
    {
        $this->seed();
        [$firstOrg, $owner] = $this->workspace('First Academy');
        [$secondOrg] = $this->workspace('Second Academy');

        Sanctum::actingAs($owner);

        // 1. Create assignment in first organization
        $createRes = $this->postJson("/api/v1/organizations/{$firstOrg->id}/assignments", [
            'title' => 'Project Architecture Design',
            'titleAr' => 'تصميم معمارية المشروع',
            'description' => 'Submit your system design document in PDF or ZIP.',
            'dueAt' => now()->addDays(7)->toIso8601String(),
            'maxScore' => 100,
            'allowedFileTypes' => 'pdf,zip',
        ])->assertCreated();

        $assignmentId = $createRes->json('data.id');
        $this->assertDatabaseHas('assignments', [
            'id' => $assignmentId,
            'organization_id' => $firstOrg->id,
            'max_score' => 100,
        ]);

        // 2. Tenant isolation check: Second org cannot access this assignment
        $this->getJson("/api/v1/organizations/{$secondOrg->id}/assignments/{$assignmentId}")
            ->assertForbidden();

        // 3. Student submits the assignment
        $student = User::factory()->create();
        Sanctum::actingAs($student);

        $submitRes = $this->postJson("/api/v1/student/assignments/{$assignmentId}/submit", [
            'submissionText' => 'Here is my completed assignment architecture proposal.',
            'attachmentUrl' => 'https://storage.ain.edu/submissions/doc-123.pdf',
            'fileName' => 'architecture_v1.pdf',
        ])->assertOk();

        $submissionId = $submitRes->json('data.id');
        $this->assertDatabaseHas('assignment_submissions', [
            'id' => $submissionId,
            'assignment_id' => $assignmentId,
            'student_id' => $student->id,
            'status' => 'submitted',
        ]);

        // 4. Instructor views submissions and grades it
        Sanctum::actingAs($owner);
        $this->getJson("/api/v1/organizations/{$firstOrg->id}/assignments/{$assignmentId}/submissions")
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $gradeRes = $this->postJson("/api/v1/organizations/{$firstOrg->id}/assignments/{$assignmentId}/submissions/{$submissionId}/grade", [
            'score' => 95,
            'feedback' => 'Excellent architecture choices and clear modular separation.',
        ])->assertOk();

        $this->assertEquals(95, $gradeRes->json('data.score'));
        $this->assertEquals('graded', $gradeRes->json('data.status'));
    }

    public function test_quiz_creation_and_auto_grading_engine(): void
    {
        $this->seed();
        [$org, $instructor] = $this->workspace('Tech Training Center');

        Sanctum::actingAs($instructor);

        // 1. Create quiz with 2 questions (10 pts each, total 20 pts, passing score 60%)
        $createQuizRes = $this->postJson("/api/v1/organizations/{$org->id}/quizzes", [
            'title' => 'Software Architecture Quiz',
            'titleAr' => 'اختبار معمارية البرمجيات',
            'description' => 'Test your knowledge on multi-tenancy and microservices.',
            'durationMinutes' => 15,
            'passingScore' => 60,
            'maxAttempts' => 2,
            'questions' => [
                [
                    'questionText' => 'What is the primary benefit of multi-tenancy?',
                    'questionTextAr' => 'ما هي الفائدة الأساسية لتعدد المستأجرين؟',
                    'type' => 'mcq',
                    'options' => [
                        ['id' => 'A', 'text' => 'Resource sharing and lower operational overhead'],
                        ['id' => 'B', 'text' => 'Completely separate physical hardware for each tenant'],
                        ['id' => 'C', 'text' => 'No database required'],
                    ],
                    'correctAnswer' => 'A',
                    'points' => 10,
                    'explanation' => 'Multi-tenancy enables shared infrastructure while preserving logical data isolation.',
                ],
                [
                    'questionText' => 'Laravel migrations run in reverse during down()',
                    'questionTextAr' => 'ملفات التهجير في لارافيل تنفذ بالعكس عند استدعاء down',
                    'type' => 'true_false',
                    'options' => [
                        ['id' => 'true', 'text' => 'True / صح'],
                        ['id' => 'false', 'text' => 'False / خطأ'],
                    ],
                    'correctAnswer' => 'true',
                    'points' => 10,
                    'explanation' => 'The down method rolls back the migration.',
                ],
            ],
        ])->assertCreated();

        $quizId = $createQuizRes->json('data.id');
        $q1Id = $createQuizRes->json('data.questions.0.id');
        $q2Id = $createQuizRes->json('data.questions.1.id');

        // 2. Student fetches quiz: verify correct answers are NOT exposed
        $student = User::factory()->create();
        Sanctum::actingAs($student);

        $studentQuizRes = $this->getJson("/api/v1/student/quizzes/{$quizId}")
            ->assertOk();

        $this->assertNull($studentQuizRes->json('data.questions.0.correct_answer'));
        $this->assertNull($studentQuizRes->json('data.questions.1.correct_answer'));

        // 3. Student takes the quiz with 1 correct answer and 1 wrong answer (10/20 = 50% -> Fail)
        $attemptFailRes = $this->postJson("/api/v1/student/quizzes/{$quizId}/attempt", [
            'answers' => [
                $q1Id => 'A', // correct
                $q2Id => 'false', // wrong (correct is 'true')
            ],
        ])->assertCreated();

        $this->assertEquals(10, $attemptFailRes->json('data.score'));
        $this->assertEquals(20, $attemptFailRes->json('data.totalPoints'));
        $this->assertEquals(50, $attemptFailRes->json('data.percentage'));
        $this->assertFalse($attemptFailRes->json('data.passed'));

        // 4. Student uses second attempt with both correct answers (20/20 = 100% -> Pass)
        $attemptPassRes = $this->postJson("/api/v1/student/quizzes/{$quizId}/attempt", [
            'answers' => [
                $q1Id => 'A',
                $q2Id => 'true',
            ],
        ])->assertCreated();

        $this->assertEquals(20, $attemptPassRes->json('data.score'));
        $this->assertEquals(100, $attemptPassRes->json('data.percentage'));
        $this->assertTrue($attemptPassRes->json('data.passed'));

        // 5. Max attempts reached (max is 2) - 3rd attempt must be rejected
        $this->postJson("/api/v1/student/quizzes/{$quizId}/attempt", [
            'answers' => [$q1Id => 'A'],
        ])->assertStatus(422)
            ->assertJsonPath('error.code', 'MAX_ATTEMPTS_REACHED');
    }

    private function workspace(string $name): array
    {
        $owner = User::factory()->create();
        $organization = Organization::query()->create([
            'name' => $name,
            'slug' => str($name)->slug().'-'.str()->random(6),
            'type' => 'academy',
        ]);
        $role = Role::query()
            ->whereNull('organization_id')
            ->where('name', OrganizationRole::Owner->value)
            ->firstOrFail();
        OrganizationMembership::query()->create([
            'organization_id' => $organization->id,
            'user_id' => $owner->id,
            'role_id' => $role->id,
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

        return [$organization, $owner];
    }
}
