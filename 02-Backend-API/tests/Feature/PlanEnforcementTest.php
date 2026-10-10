<?php

namespace Tests\Feature;

use App\Models\AcademyProfile;
use App\Models\ContentItem;
use App\Models\Course;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\OrganizationSubscription;
use App\Models\Plan;
use App\Models\PlanModule;
use App\Models\Role;
use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PlanEnforcementTest extends TestCase
{
    use RefreshDatabase;

    public function test_expired_active_subscription_does_not_enable_modules(): void
    {
        $this->seed();
        $user = User::factory()->create();
        $organization = Organization::query()->create([
            'name' => 'Expired Academy',
            'slug' => 'expired-academy',
            'type' => 'academy',
        ]);
        $role = Role::query()
            ->whereNull('organization_id')
            ->where('name', 'organization_owner')
            ->firstOrFail();
        OrganizationMembership::query()->create([
            'organization_id' => $organization->id,
            'user_id' => $user->id,
            'role_id' => $role->id,
            'status' => 'active',
            'joined_at' => now(),
        ]);
        OrganizationSubscription::query()->create([
            'organization_id' => $organization->id,
            'plan_id' => Plan::query()->where('code', 'growth')->firstOrFail()->id,
            'status' => 'active',
            'billing_interval' => 'monthly',
            'current_period_starts_at' => now()->subMonths(2),
            'current_period_ends_at' => now()->subMonth(),
        ]);

        Sanctum::actingAs($user);

        $this->getJson("/api/v1/organizations/{$organization->id}/courses")
            ->assertForbidden()
            ->assertJsonPath('error.code', 'MODULE_DISABLED')
            ->assertJsonPath('error.details.upgradeRequired', true);
        $this->getJson("/api/v1/organizations/{$organization->id}/rooms")
            ->assertForbidden()
            ->assertJsonPath('error.code', 'MODULE_DISABLED');
        $this->getJson("/api/v1/organizations/{$organization->id}/content")
            ->assertForbidden()
            ->assertJsonPath('error.code', 'MODULE_DISABLED');

        AcademyProfile::query()->create([
            'organization_id' => $organization->id,
            'slug' => 'expired-academy',
            'public_name' => 'Expired Academy',
            'description' => 'This profile must not remain public.',
            'is_public' => true,
            'verification_status' => 'verified',
            'verified_at' => now(),
        ]);

        $this->getJson('/api/v1/public/academies')
            ->assertOk()
            ->assertJsonPath('meta.total', 0);
    }

    public function test_unexpired_grace_period_still_enables_modules(): void
    {
        $this->seed();
        $user = User::factory()->create();
        $organization = Organization::query()->create([
            'name' => 'Grace Academy',
            'slug' => 'grace-academy',
            'type' => 'academy',
        ]);
        $role = Role::query()
            ->whereNull('organization_id')
            ->where('name', 'organization_owner')
            ->firstOrFail();
        OrganizationMembership::query()->create([
            'organization_id' => $organization->id,
            'user_id' => $user->id,
            'role_id' => $role->id,
            'status' => 'active',
            'joined_at' => now(),
        ]);
        OrganizationSubscription::query()->create([
            'organization_id' => $organization->id,
            'plan_id' => Plan::query()->where('code', 'growth')->firstOrFail()->id,
            'status' => 'grace',
            'billing_interval' => 'monthly',
            'current_period_starts_at' => now()->subMonth(),
            'current_period_ends_at' => now()->subDay(),
            'grace_ends_at' => now()->addDays(3),
        ]);

        Sanctum::actingAs($user);

        $this->getJson("/api/v1/organizations/{$organization->id}/courses")
            ->assertOk();

        AcademyProfile::query()->create([
            'organization_id' => $organization->id,
            'slug' => 'grace-academy',
            'public_name' => 'Grace Academy',
            'description' => 'This profile remains public during grace.',
            'is_public' => true,
            'verification_status' => 'verified',
            'verified_at' => now(),
        ]);

        $this->getJson('/api/v1/public/academies')
            ->assertOk()
            ->assertJsonPath('meta.total', 1);
    }

    public function test_admin_can_view_plan_usage(): void
    {
        $this->seed();
        [$organization, $user] = $this->organizationWithSubscription();
        Room::query()->create([
            'organization_id' => $organization->id,
            'created_by' => $user->id,
            'name' => 'Usage Room',
            'slug' => 'usage-room',
            'status' => 'active',
        ]);
        Course::query()->create([
            'organization_id' => $organization->id,
            'academy_profile_id' => null,
            'created_by' => $user->id,
            'slug' => 'usage-course',
            'title' => 'Usage Course',
            'delivery_type' => 'online',
            'price_minor' => 10000,
            'currency' => 'EGP',
            'status' => 'draft',
        ]);

        Sanctum::actingAs($user);
        $this->getJson("/api/v1/organizations/{$organization->id}/plan-usage")
            ->assertOk()
            ->assertJsonPath('data.subscription.plan.code', 'growth')
            ->assertJsonPath('data.usage.0.metric', 'rooms')
            ->assertJsonFragment([
                'metric' => 'courses',
                'current' => 1,
                'limit' => 20,
                'enabled' => true,
            ]);
    }

    public function test_content_creation_respects_plan_content_limit(): void
    {
        $this->seed();
        [$organization, $user] = $this->organizationWithSubscription();
        $plan = Plan::query()->where('code', 'growth')->firstOrFail();
        PlanModule::query()->updateOrCreate([
            'plan_id' => $plan->id,
            'module' => 'content',
        ], [
            'enabled' => true,
            'limit_value' => 1,
        ]);
        $room = Room::query()->create([
            'organization_id' => $organization->id,
            'created_by' => $user->id,
            'name' => 'Content Room',
            'slug' => 'content-room',
            'status' => 'active',
        ]);
        ContentItem::query()->create([
            'organization_id' => $organization->id,
            'room_id' => $room->id,
            'created_by' => $user->id,
            'title' => 'Existing video',
            'type' => 'youtube',
            'video_provider' => 'youtube',
            'external_video_id' => 'dQw4w9WgXcQ',
            'status' => 'published',
        ]);

        Sanctum::actingAs($user);
        $this->postJson("/api/v1/organizations/{$organization->id}/content", [
            'roomId' => $room->id,
            'title' => 'Blocked video',
            'type' => 'youtube',
            'externalUrl' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        ])
            ->assertStatus(409)
            ->assertJsonPath('error.code', 'PLAN_LIMIT_REACHED')
            ->assertJsonPath('error.details.module', 'content');
    }

    /**
     * @return array{Organization, User}
     */
    private function organizationWithSubscription(): array
    {
        $user = User::factory()->create();
        $organization = Organization::query()->create([
            'name' => 'Usage Academy',
            'slug' => fake()->unique()->slug(),
            'type' => 'academy',
        ]);
        $role = Role::query()
            ->whereNull('organization_id')
            ->where('name', 'organization_owner')
            ->firstOrFail();
        OrganizationMembership::query()->create([
            'organization_id' => $organization->id,
            'user_id' => $user->id,
            'role_id' => $role->id,
            'status' => 'active',
            'joined_at' => now(),
        ]);
        OrganizationSubscription::query()->create([
            'organization_id' => $organization->id,
            'plan_id' => Plan::query()->where('code', 'growth')->firstOrFail()->id,
            'status' => 'trial',
            'billing_interval' => 'monthly',
            'trial_ends_at' => now()->addMonth(),
            'current_period_starts_at' => now(),
            'current_period_ends_at' => now()->addMonth(),
        ]);

        return [$organization, $user];
    }
}
