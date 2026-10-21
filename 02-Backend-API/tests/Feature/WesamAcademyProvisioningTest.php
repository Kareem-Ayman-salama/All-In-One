<?php

namespace Tests\Feature;

use App\Models\CourseLesson;
use App\Models\CourseModule;
use App\Models\Organization;
use App\Models\User;
use App\Services\Provisioning\WesamGrammarAcademyProvisioner;
use Database\Seeders\AuthorizationSeeder;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WesamAcademyProvisioningTest extends TestCase
{
    use RefreshDatabase;

    public function test_provisioning_is_private_complete_and_idempotent(): void
    {
        $this->seed([AuthorizationSeeder::class, PlanSeeder::class]);
        $service = app(WesamGrammarAcademyProvisioner::class);

        $first = $service->provision('wesam@ainplatform.com', Str::password(24), true);
        $second = $service->provision('wesam@ainplatform.com', null);

        $organization = Organization::query()->where('slug', WesamGrammarAcademyProvisioner::SLUG)->firstOrFail();
        $owner = User::query()->where('normalized_email', 'wesam@ainplatform.com')->firstOrFail();

        $this->assertSame($first['organizationId'], $second['organizationId']);
        $this->assertSame('solo_instructor', $organization->settings['workspace_mode']);
        $this->assertFalse($organization->settings['marketplace_enabled']);
        $this->assertTrue($owner->must_change_password);
        $this->assertNull($owner->platform_role);
        $this->assertCount(1, $owner->memberships);
        $this->assertSame('organization_owner', $owner->memberships()->firstOrFail()->role->name);
        $this->assertDatabaseHas('academy_profiles', ['organization_id' => $organization->id, 'is_public' => false]);
        $this->assertDatabaseHas('instructors', ['organization_id' => $organization->id, 'user_id' => $owner->id]);
        $this->assertDatabaseHas('courses', [
            'organization_id' => $organization->id,
            'status' => 'draft',
            'cover_path' => '/images/courses/wesam-nahw-journey.jpg',
        ]);
        $this->assertSame(10, CourseModule::query()->where('organization_id', $organization->id)->count());
        $this->assertSame(41, CourseLesson::query()->where('organization_id', $organization->id)->count());
        $this->assertSame(3, $first['practiceQuizzes']);
        $this->assertDatabaseCount('quizzes', 3);
        $this->assertDatabaseCount('quiz_questions', 18);
        $this->assertDatabaseHas('quizzes', [
            'organization_id' => $organization->id,
            'title_ar' => 'تدريب المبتدأ والخبر',
            'is_published' => true,
            'passing_score' => 70,
        ]);
        $this->assertDatabaseHas('rooms', ['organization_id' => $organization->id, 'name' => 'غرفة أكاديمية النحو']);
        $this->assertDatabaseHas('course_batches', [
            'organization_id' => $organization->id,
            'title' => 'الدفعة الأولى',
            'status' => 'draft',
            'start_date' => null,
            'capacity' => null,
        ]);
        $this->assertDatabaseCount('course_enrollments', 0);
        $this->assertDatabaseCount('payments', 0);
        $this->assertDatabaseCount('certificates', 0);

        Sanctum::actingAs($owner);
        $courseId = $first['courseId'];
        $response = $this->getJson("/api/v1/organizations/{$organization->id}/courses/{$courseId}/curriculum")
            ->assertOk()
            ->assertJsonCount(10, 'data.modules')
            ->assertJsonPath('data.course.status', 'draft');

        $moduleId = $response->json('data.modules.0.id');
        $this->postJson("/api/v1/organizations/{$organization->id}/courses/{$courseId}/lessons", [
            'moduleId' => $moduleId,
            'title' => 'درس تجريبي للمراجعة',
            'titleAr' => 'درس تجريبي للمراجعة',
            'type' => 'written',
            'status' => 'draft',
        ])->assertCreated()->assertJsonPath('data.status', 'draft');

        $otherOrganization = Organization::query()->create([
            'name' => 'Other Academy',
            'slug' => 'other-academy',
            'type' => 'academy',
            'status' => 'active',
        ]);
        $this->getJson("/api/v1/organizations/{$otherOrganization->id}/courses/{$courseId}/curriculum")
            ->assertForbidden();
    }
}
