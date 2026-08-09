<?php

namespace Tests\Feature;

use App\Domain\Tenancy\Enums\OrganizationRole;
use App\Models\Announcement;
use App\Models\ContentItem;
use App\Models\Event;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\OrganizationSubscription;
use App\Models\Plan;
use App\Models\Role;
use App\Models\Room;
use App\Models\RoomMembership;
use App\Models\User;
use App\Models\WorkspaceInvitation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WorkspaceOperationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_verified_user_can_create_workspace_with_owner_membership_and_trial(): void
    {
        $this->seed();
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        $response = $this->postJson('/api/v1/organizations', [
            'name' => 'AIO Academy',
            'type' => 'academy',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.organization.name', 'AIO Academy')
            ->assertJsonPath(
                'data.organization.subscriptions.0.status',
                'trial',
            )
            ->assertJsonPath(
                'data.organization.subscriptions.0.plan.code',
                'growth',
            );

        $organizationId = $response->json('data.organization.id');
        $this->assertDatabaseHas('organization_memberships', [
            'organization_id' => $organizationId,
            'user_id' => $owner->id,
            'status' => 'active',
        ]);
        $subscription = OrganizationSubscription::query()
            ->where('organization_id', $organizationId)
            ->firstOrFail();
        $this->assertSame(
            30,
            (int) $subscription->current_period_starts_at->diffInDays(
                $subscription->trial_ends_at,
            ),
        );
        $this->assertDatabaseHas('audit_logs', [
            'organization_id' => $organizationId,
            'action' => 'organization.created',
        ]);
        $this->assertDatabaseHas('outbox_events', [
            'organization_id' => $organizationId,
            'event_type' => 'organization.created',
        ]);
    }

    public function test_owner_can_manage_rooms_but_student_cannot_create_them(): void
    {
        $this->seed();
        [$organization, $owner] = $this->organizationWithMember(
            OrganizationRole::Owner,
        );
        Sanctum::actingAs($owner);

        $roomResponse = $this->postJson(
            "/api/v1/organizations/{$organization->id}/rooms",
            [
                'name' => 'Physics Grade 12',
                'accessType' => 'collaborative',
            ],
        );

        $roomResponse
            ->assertCreated()
            ->assertJsonPath('data.organization_id', $organization->id)
            ->assertJsonPath('data.slug', 'physics-grade-12');

        $student = User::factory()->create();
        $studentRole = Role::query()
            ->whereNull('organization_id')
            ->where('name', OrganizationRole::Student->value)
            ->firstOrFail();
        OrganizationMembership::query()->create([
            'organization_id' => $organization->id,
            'user_id' => $student->id,
            'role_id' => $studentRole->id,
            'status' => 'active',
            'joined_at' => now(),
        ]);
        Sanctum::actingAs($student);

        $this->postJson(
            "/api/v1/organizations/{$organization->id}/rooms",
            ['name' => 'Forbidden Room'],
        )
            ->assertForbidden()
            ->assertJsonPath('error.code', 'FORBIDDEN');
    }

    public function test_invitation_acceptance_is_email_bound_and_idempotently_links_rooms(): void
    {
        $this->seed();
        [$organization, $owner] = $this->organizationWithMember(
            OrganizationRole::Owner,
        );
        $room = Room::query()->create([
            'organization_id' => $organization->id,
            'created_by' => $owner->id,
            'name' => 'English Course',
            'slug' => 'english-course',
            'status' => 'active',
        ]);
        Sanctum::actingAs($owner);

        $inviteResponse = $this->postJson(
            "/api/v1/organizations/{$organization->id}/invitations",
            [
                'email' => 'student@example.com',
                'role' => OrganizationRole::Student->value,
                'roomIds' => [$room->id],
            ],
        );
        $inviteResponse
            ->assertCreated()
            ->assertJsonPath('data.invitation.status', 'pending');
        $token = $inviteResponse->json('data.token');
        $this->getJson("/api/v1/public/invitations/{$token}")
            ->assertOk()
            ->assertJsonPath('data.organization.id', $organization->id)
            ->assertJsonPath('data.role', OrganizationRole::Student->value)
            ->assertJsonPath('data.rooms.0.id', $room->id);

        $wrongUser = User::factory()->create(['email' => 'wrong@example.com']);
        Sanctum::actingAs($wrongUser);
        $this->postJson('/api/v1/invitations/accept', ['token' => $token])
            ->assertForbidden()
            ->assertJsonPath('error.code', 'INVITATION_EMAIL_MISMATCH');

        $student = User::factory()->create(['email' => 'student@example.com']);
        Sanctum::actingAs($student);
        $this->postJson('/api/v1/invitations/accept', ['token' => $token])
            ->assertOk()
            ->assertJsonPath('data.organization.id', $organization->id)
            ->assertJsonPath('data.role', OrganizationRole::Student->value);

        $this->assertDatabaseHas('organization_memberships', [
            'organization_id' => $organization->id,
            'user_id' => $student->id,
            'status' => 'active',
        ]);
        $this->assertDatabaseHas('room_memberships', [
            'organization_id' => $organization->id,
            'room_id' => $room->id,
            'user_id' => $student->id,
            'status' => 'active',
        ]);
        $this->assertSame(
            1,
            RoomMembership::query()
                ->where('room_id', $room->id)
                ->where('user_id', $student->id)
                ->count(),
        );
        $this->assertSame(
            'accepted',
            WorkspaceInvitation::query()->firstOrFail()->status,
        );

        $this->postJson('/api/v1/invitations/accept', ['token' => $token])
            ->assertStatus(410)
            ->assertJsonPath('error.code', 'INVITATION_EXPIRED');
    }

    public function test_room_from_another_workspace_is_never_resolved(): void
    {
        $this->seed();
        [$allowed, $owner] = $this->organizationWithMember(
            OrganizationRole::Owner,
        );
        $blocked = Organization::query()->create([
            'name' => 'Blocked Academy',
            'slug' => 'blocked-academy',
        ]);
        $blockedRoom = Room::query()->create([
            'organization_id' => $blocked->id,
            'created_by' => $owner->id,
            'name' => 'Blocked Room',
            'slug' => 'blocked-room',
            'status' => 'active',
        ]);
        Sanctum::actingAs($owner);

        $this->getJson(
            "/api/v1/organizations/{$allowed->id}/rooms/{$blockedRoom->id}",
        )
            ->assertNotFound()
            ->assertJsonPath('error.code', 'RESOURCE_NOT_FOUND');
    }

    public function test_student_only_lists_resources_from_joined_rooms(): void
    {
        $this->seed();
        [$organization, $owner] = $this->organizationWithMember(
            OrganizationRole::Owner,
        );
        $allowedRoom = $this->createRoom($organization, $owner, 'Allowed Room');
        $privateRoom = $this->createRoom($organization, $owner, 'Private Room');
        $student = User::factory()->create();
        $studentRole = Role::query()
            ->whereNull('organization_id')
            ->where('name', OrganizationRole::Student->value)
            ->firstOrFail();
        OrganizationMembership::query()->create([
            'organization_id' => $organization->id,
            'user_id' => $student->id,
            'role_id' => $studentRole->id,
            'status' => 'active',
            'joined_at' => now(),
        ]);
        RoomMembership::query()->create([
            'organization_id' => $organization->id,
            'room_id' => $allowedRoom->id,
            'user_id' => $student->id,
            'role' => 'student',
            'status' => 'active',
            'joined_at' => now(),
        ]);

        foreach ([$allowedRoom, $privateRoom] as $room) {
            ContentItem::query()->create([
                'organization_id' => $organization->id,
                'room_id' => $room->id,
                'created_by' => $owner->id,
                'title' => "{$room->name} Content",
                'type' => 'link',
                'external_url' => 'https://example.com',
                'status' => 'published',
            ]);
            Announcement::query()->create([
                'organization_id' => $organization->id,
                'room_id' => $room->id,
                'created_by' => $owner->id,
                'title' => "{$room->name} Announcement",
                'body' => 'Announcement body',
                'audience' => 'room',
                'published_at' => now(),
            ]);
            Event::query()->create([
                'organization_id' => $organization->id,
                'room_id' => $room->id,
                'created_by' => $owner->id,
                'title' => "{$room->name} Event",
                'starts_at' => now()->addDay(),
                'ends_at' => now()->addDay()->addHour(),
            ]);
        }
        Announcement::query()->create([
            'organization_id' => $organization->id,
            'room_id' => null,
            'created_by' => $owner->id,
            'title' => 'Organization Announcement',
            'body' => 'Visible to every organization member',
            'audience' => 'organization',
            'published_at' => now(),
        ]);

        Sanctum::actingAs($student);
        $base = "/api/v1/organizations/{$organization->id}";

        $this->getJson("{$base}/rooms")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $allowedRoom->id);
        $this->getJson("{$base}/rooms/{$privateRoom->id}")
            ->assertForbidden()
            ->assertJsonPath('error.code', 'ROOM_ACCESS_DENIED');
        $this->getJson("{$base}/content")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.room_id', $allowedRoom->id);
        $this->getJson("{$base}/announcements")
            ->assertOk()
            ->assertJsonCount(2, 'data');
        $this->getJson("{$base}/events")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.room_id', $allowedRoom->id);
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
        ]);
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
        $plan = Plan::query()->where('code', 'starter')->firstOrFail();
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

    private function createRoom(
        Organization $organization,
        User $owner,
        string $name,
    ): Room {
        return Room::query()->create([
            'organization_id' => $organization->id,
            'created_by' => $owner->id,
            'name' => $name,
            'slug' => str($name)->slug()->toString(),
            'status' => 'active',
        ]);
    }
}
