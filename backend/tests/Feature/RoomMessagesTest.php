<?php

namespace Tests\Feature;

use App\Domain\Tenancy\Enums\OrganizationRole;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\OrganizationSubscription;
use App\Models\Plan;
use App\Models\Role;
use App\Models\Room;
use App\Models\RoomMembership;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RoomMessagesTest extends TestCase
{
    use RefreshDatabase;

    public function test_room_members_can_send_and_read_messages(): void
    {
        $this->seed();
        [$organization, $owner] = $this->organizationWithMember(
            OrganizationRole::Owner,
        );
        $room = $this->room($organization, $owner);
        $student = $this->organizationUser(
            $organization,
            OrganizationRole::Student,
        );
        RoomMembership::query()->create([
            'organization_id' => $organization->id,
            'room_id' => $room->id,
            'user_id' => $student->id,
            'role' => 'student',
            'status' => 'active',
            'joined_at' => now(),
        ]);

        Sanctum::actingAs($owner);
        $response = $this->postJson(
            "/api/v1/organizations/{$organization->id}/rooms/{$room->id}/messages",
            ['body' => 'Welcome to the room.'],
        )
            ->assertCreated()
            ->assertJsonPath('data.body', 'Welcome to the room.')
            ->assertJsonPath('data.user.id', $owner->id);

        $messageId = $response->json('data.id');
        $this->assertDatabaseHas('room_messages', [
            'id' => $messageId,
            'organization_id' => $organization->id,
            'room_id' => $room->id,
            'user_id' => $owner->id,
            'body' => 'Welcome to the room.',
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'organization_id' => $organization->id,
            'action' => 'room_message.created',
        ]);

        Sanctum::actingAs($student);
        $this->getJson(
            "/api/v1/organizations/{$organization->id}/rooms/{$room->id}/messages",
        )
            ->assertOk()
            ->assertJsonPath('data.0.id', $messageId);

        $this->postJson(
            "/api/v1/organizations/{$organization->id}/rooms/{$room->id}/messages",
            ['body' => 'Thanks, received.'],
        )
            ->assertCreated()
            ->assertJsonPath('data.user.id', $student->id);
    }

    public function test_user_without_room_access_cannot_read_or_send_messages(): void
    {
        $this->seed();
        [$organization, $owner] = $this->organizationWithMember(
            OrganizationRole::Owner,
        );
        $room = $this->room($organization, $owner);
        $student = $this->organizationUser(
            $organization,
            OrganizationRole::Student,
        );

        Sanctum::actingAs($student);
        $this->getJson(
            "/api/v1/organizations/{$organization->id}/rooms/{$room->id}/messages",
        )
            ->assertForbidden()
            ->assertJsonPath('error.code', 'ROOM_ACCESS_DENIED');

        $this->postJson(
            "/api/v1/organizations/{$organization->id}/rooms/{$room->id}/messages",
            ['body' => 'Can I join?'],
        )
            ->assertForbidden()
            ->assertJsonPath('error.code', 'ROOM_ACCESS_DENIED');
    }

    /**
     * @return array{Organization, User}
     */
    private function organizationWithMember(
        OrganizationRole $roleName,
    ): array {
        $user = User::factory()->create();
        $organization = Organization::query()->create([
            'name' => fake()->company(),
            'slug' => fake()->unique()->slug(),
            'status' => 'active',
        ]);
        $this->attachMember($organization, $user, $roleName);
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

        return [$organization, $user];
    }

    private function organizationUser(
        Organization $organization,
        OrganizationRole $roleName,
    ): User {
        $user = User::factory()->create();
        $this->attachMember($organization, $user, $roleName);

        return $user;
    }

    private function attachMember(
        Organization $organization,
        User $user,
        OrganizationRole $roleName,
    ): void {
        $role = Role::query()
            ->whereNull('organization_id')
            ->where('name', $roleName->value)
            ->firstOrFail();
        OrganizationMembership::query()->create([
            'organization_id' => $organization->id,
            'user_id' => $user->id,
            'role_id' => $role->id,
            'status' => 'active',
            'joined_at' => now(),
        ]);
    }

    private function room(Organization $organization, User $owner): Room
    {
        return Room::query()->create([
            'organization_id' => $organization->id,
            'created_by' => $owner->id,
            'name' => 'Live Classroom',
            'slug' => 'live-classroom',
            'status' => 'active',
        ]);
    }
}
