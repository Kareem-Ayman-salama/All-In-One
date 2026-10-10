<?php

namespace Tests\Feature;

use App\Domain\Tenancy\Enums\OrganizationRole;
use App\Models\Instructor;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\OrganizationSubscription;
use App\Models\Plan;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TasksAndLessonBookingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_task_lists_are_tenant_isolated(): void
    {
        $this->seed();
        [$first, $owner] = $this->workspace('First Workspace');
        [$second] = $this->workspace('Second Workspace');
        Sanctum::actingAs($owner);

        $this->postJson("/api/v1/organizations/{$first->id}/tasks", [
            'title' => 'Prepare the lesson material',
            'priority' => 'high',
            'status' => 'todo',
        ])->assertCreated();

        $this->getJson("/api/v1/organizations/{$first->id}/tasks")
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->getJson("/api/v1/organizations/{$second->id}/tasks")
            ->assertForbidden()
            ->assertJsonPath('error.code', 'TENANT_ACCESS_DENIED');
    }

    public function test_only_one_student_can_reserve_an_instructor_slot(): void
    {
        $this->seed();
        [$organization, $owner] = $this->workspace('Lesson Academy');
        $instructor = Instructor::query()->create([
            'organization_id' => $organization->id,
            'name' => 'Sarah Hassan',
            'specialties' => ['English'],
            'status' => 'active',
        ]);
        Sanctum::actingAs($owner);
        $slot = $this->postJson(
            "/api/v1/organizations/{$organization->id}/instructor-slots",
            [
                'instructorId' => $instructor->id,
                'startsAt' => now()->addDay()->toIso8601String(),
                'endsAt' => now()->addDay()->addHour()->toIso8601String(),
                'deliveryType' => 'online',
                'priceMinor' => 25000,
            ],
        )->assertCreated()->json('data');

        $firstStudent = User::factory()->create();
        Sanctum::actingAs($firstStudent);
        $this->postJson('/api/v1/student/lesson-bookings', [
            'slotId' => $slot['id'],
            'subject' => 'English',
        ])->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR');

        $this->postJson('/api/v1/student/lesson-bookings', [
            'slotId' => $slot['id'],
            'subject' => 'English',
            'studentPhone' => '+201000000001',
        ])->assertCreated()->assertJsonPath('data.status', 'confirmed');

        $secondStudent = User::factory()->create();
        Sanctum::actingAs($secondStudent);
        $this->postJson('/api/v1/student/lesson-bookings', [
            'slotId' => $slot['id'],
            'subject' => 'English',
            'studentPhone' => '+201000000002',
        ])->assertConflict()->assertJsonPath('error.code', 'SLOT_UNAVAILABLE');

        $this->assertDatabaseCount('lesson_bookings', 1);
    }

    /**
     * @return array{Organization, User}
     */
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
