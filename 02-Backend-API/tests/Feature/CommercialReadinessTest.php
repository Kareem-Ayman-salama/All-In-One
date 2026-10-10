<?php

namespace Tests\Feature;

use App\Domain\Marketplace\Enums\CourseStatus;
use App\Domain\Tenancy\Enums\OrganizationRole;
use App\Models\AcademyProfile;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\Role;
use App\Models\User;
use App\Services\Analytics\ProductAnalyticsService;
use Database\Seeders\AuthorizationSeeder;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CommercialReadinessTest extends TestCase
{
    use RefreshDatabase;

    public function test_demo_workspace_seeder_creates_active_academy_with_students_and_payments(): void
    {
        $this->seed(PlanSeeder::class);
        $this->seed(AuthorizationSeeder::class);

        $exitCode = Artisan::call('demo:seed-workspace', ['--reset' => true]);

        $this->assertEquals(0, $exitCode, 'Demo seeder command must exit with code 0');

        $this->assertDatabaseHas('organizations', [
            'slug' => 'elite-future-academy',
            'status' => 'active',
        ]);

        $this->assertDatabaseHas('courses', [
            'slug' => 'modern-physics-demo',
            'status' => CourseStatus::Published->value,
        ]);

        $this->assertDatabaseHas('guardian_consents', [
            'status' => 'approved',
        ]);

        $this->assertDatabaseHas('payments', [
            'provider' => 'paymob',
            'status' => 'paid',
            'amount_minor' => 85000,
        ]);
    }

    public function test_demo_workspace_reset_can_be_run_repeatedly(): void
    {
        $this->seed(PlanSeeder::class);
        $this->seed(AuthorizationSeeder::class);

        $firstExitCode = Artisan::call('demo:seed-workspace', ['--reset' => true]);
        $secondExitCode = Artisan::call('demo:seed-workspace', ['--reset' => true]);

        $this->assertSame(0, $firstExitCode);
        $this->assertSame(0, $secondExitCode);
        $this->assertSame(
            1,
            Organization::query()->where('slug', 'elite-future-academy')->count(),
        );
    }

    public function test_product_analytics_service_calculates_activation_funnel(): void
    {
        $this->seed(PlanSeeder::class);
        $this->seed(AuthorizationSeeder::class);

        // Seed a demo workspace first
        Artisan::call('demo:seed-workspace', ['--reset' => true]);

        $analytics = app(ProductAnalyticsService::class);
        $scorecard = $analytics->getScorecard();

        $this->assertGreaterThan(0, $scorecard['academies']['total']);
        $this->assertCount(6, $scorecard['activation_funnel']);
        $this->assertGreaterThan(0, $scorecard['minor_safety']['approved_consents_count']);
        $this->assertEquals(85000, $scorecard['revenue_gmv']['gross_volume_minor']);
    }

    public function test_academy_onboarding_wizard_reports_accurate_checklist(): void
    {
        $this->seed(AuthorizationSeeder::class);

        $owner = User::factory()->create();
        $org = Organization::query()->create([
            'name' => 'New Onboarding Academy',
            'slug' => 'new-onboarding-academy',
            'status' => 'active',
        ]);

        $ownerRole = Role::query()->where('name', OrganizationRole::Owner->value)->firstOrFail();
        OrganizationMembership::query()->create([
            'organization_id' => $org->id,
            'user_id' => $owner->id,
            'role_id' => $ownerRole->id,
            'status' => 'active',
            'joined_at' => now(),
        ]);

        Sanctum::actingAs($owner);

        // 1. Initial State: No profile, no courses -> Progress 0%
        $response = $this->getJson("/api/v1/onboarding/wizard?organization_id={$org->id}")
            ->assertOk()
            ->assertJsonPath('data.is_fully_onboarded', false)
            ->assertJsonPath('data.completed_steps', 0)
            ->assertJsonPath('data.progress_percent', 0)
            ->assertJsonPath('data.next_step.id', 'profile');

        // 2. Add profile -> Progress increments
        AcademyProfile::query()->create([
            'organization_id' => $org->id,
            'slug' => 'new-onboarding-academy',
            'public_name' => 'New Onboarding Academy',
            'description' => 'Profile created.',
            'is_public' => true,
        ]);

        $updatedResponse = $this->getJson("/api/v1/onboarding/wizard?organization_id={$org->id}")
            ->assertOk()
            ->assertJsonPath('data.completed_steps', 1)
            ->assertJsonPath('data.progress_percent', 20)
            ->assertJsonPath('data.next_step.id', 'course');
    }
}
