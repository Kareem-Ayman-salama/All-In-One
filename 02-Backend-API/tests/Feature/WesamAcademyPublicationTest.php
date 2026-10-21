<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseBatch;
use App\Models\Organization;
use App\Models\Quiz;
use App\Models\User;
use App\Services\Provisioning\WesamGrammarAcademyProvisioner;
use App\Services\Provisioning\WesamGrammarAcademyPublisher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WesamAcademyPublicationTest extends TestCase
{
    use RefreshDatabase;

    public function test_academy_is_published_as_a_free_recorded_course(): void
    {
        $this->seed();
        app(WesamGrammarAcademyProvisioner::class)->provision(
            'wesam@ainplatform.test',
            'Temporary!Password2026',
            true,
            true,
        );

        $result = app(WesamGrammarAcademyPublisher::class)->publish();

        $this->assertTrue($result['academyPublic']);
        $this->assertSame('published', $result['courseStatus']);
        $this->assertSame('recorded', $result['deliveryType']);
        $this->assertSame(0, $result['priceMinor']);
        $this->assertDatabaseHas('academy_profiles', [
            'slug' => WesamGrammarAcademyProvisioner::SLUG,
            'is_public' => true,
            'verification_status' => 'verified',
        ]);
        $this->assertDatabaseHas('courses', [
            'slug' => 'nahw-from-foundations-to-mastery',
            'delivery_type' => 'recorded',
            'price_minor' => 0,
            'status' => 'published',
        ]);
        $this->assertDatabaseHas('course_batches', [
            'title' => 'الدفعة الأولى',
            'delivery_type' => 'recorded',
            'capacity' => null,
            'status' => 'open',
        ]);

        $organization = Organization::query()
            ->where('slug', WesamGrammarAcademyProvisioner::SLUG)
            ->firstOrFail();
        $this->assertTrue($organization->settings['marketplace_enabled']);
        $this->assertFalse($organization->settings['setup_mode']);

        $course = Course::query()
            ->where('organization_id', $organization->id)
            ->firstOrFail();
        $batch = CourseBatch::query()
            ->where('course_id', $course->id)
            ->firstOrFail();
        $this->getJson('/api/v1/public/courses')
            ->assertOk()
            ->assertJsonFragment(['id' => $course->id]);
        $this->getJson("/api/v1/public/courses/{$course->slug}")
            ->assertOk()
            ->assertJsonPath('data.priceMinor', 0)
            ->assertJsonPath('data.deliveryType', 'recorded')
            ->assertJsonPath('data.batches.0.id', $batch->id)
            ->assertJsonPath('data.batches.0.capacity', null);
        $this->getJson('/api/v1/public/academies')
            ->assertOk()
            ->assertJsonFragment(['slug' => WesamGrammarAcademyProvisioner::SLUG]);

        $student = User::factory()->create();
        Sanctum::actingAs($student);
        $quiz = Quiz::query()->where('course_id', $course->id)->firstOrFail();
        $this->getJson('/api/v1/student/quizzes')
            ->assertOk()
            ->assertJsonFragment(['id' => $quiz->id]);
        $this->getJson("/api/v1/student/quizzes/{$quiz->id}")
            ->assertOk()
            ->assertJsonCount(6, 'data.questions');

        $reconciled = app(WesamGrammarAcademyProvisioner::class)->provision(
            'wesam@ainplatform.test',
            null,
            false,
            true,
        );
        $this->assertTrue($reconciled['marketplaceEnabled']);
        $this->assertDatabaseHas('academy_profiles', [
            'slug' => WesamGrammarAcademyProvisioner::SLUG,
            'is_public' => true,
        ]);
        $this->assertDatabaseHas('courses', [
            'id' => $course->id,
            'delivery_type' => 'recorded',
            'status' => 'published',
        ]);
        $this->assertDatabaseHas('course_batches', [
            'id' => $batch->id,
            'delivery_type' => 'recorded',
            'status' => 'open',
        ]);
    }
}
