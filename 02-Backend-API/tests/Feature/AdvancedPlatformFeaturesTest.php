<?php

namespace Tests\Feature;

use App\Domain\Tenancy\Enums\OrganizationRole;
use App\Models\Certificate;
use App\Models\ContentItem;
use App\Models\Course;
use App\Models\CourseBatch;
use App\Models\Event;
use App\Models\LearningSession;
use App\Models\Notification;
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

class AdvancedPlatformFeaturesTest extends TestCase
{
    use RefreshDatabase;

    public function test_personal_calendar_reminders_are_private_and_generate_notifications(): void
    {
        $this->seed();
        [$org, $member] = $this->workspace('Reminder Academy');

        Sanctum::actingAs($member);

        $response = $this->postJson('/api/v1/calendar/reminders', [
            'organizationId' => $org->id,
            'title' => 'Pay course renewal',
            'titleAr' => 'دفع تجديد الكورس',
            'notes' => 'Renew before access expires.',
            'startsAt' => now()->addMinutes(5)->toIso8601String(),
            'reminderMinutes' => 10,
        ])->assertCreated();

        $eventId = $response->json('data.id');
        $this->assertDatabaseHas('events', [
            'id' => $eventId,
            'created_by' => $member->id,
            'is_private' => true,
            'type' => 'personal_reminder',
        ]);

        $this->getJson('/api/v1/calendar/reminders')
            ->assertOk()
            ->assertJsonPath('data.0.id', $eventId);

        $organizationEvents = $this->getJson("/api/v1/organizations/{$org->id}/events")
            ->assertOk();
        $this->assertNotContains($eventId, collect($organizationEvents->json('data'))->pluck('id')->all());

        $this->artisan('aio:maintenance')->assertSuccessful();
        $this->assertDatabaseHas('notifications', [
            'user_id' => $member->id,
            'type' => 'calendar_reminder',
            'target_id' => $eventId,
        ]);

        Event::query()->findOrFail($eventId)->update(['starts_at' => now()->subMinute()]);
        $this->artisan('aio:maintenance')->assertSuccessful();
        $this->assertDatabaseHas('notifications', [
            'user_id' => $member->id,
            'type' => 'calendar_reminder_now',
            'target_id' => $eventId,
        ]);

        $this->assertSame(2, Notification::query()->where('target_id', $eventId)->count());
    }

    public function test_certificate_issuance_and_public_qr_verification(): void
    {
        $this->seed();
        [$org, $admin] = $this->workspace('Cairo Tech Academy');

        $course = Course::factory()->create(['organization_id' => $org->id, 'title' => 'Flutter Full Stack', 'title_ar' => 'فلاتر متكامل']);
        $student = User::factory()->create(['name' => 'Tarek Student']);

        Sanctum::actingAs($admin);

        // 1. Issue certificate
        $issueRes = $this->postJson("/api/v1/organizations/{$org->id}/certificates", [
            'courseId' => $course->id,
            'studentId' => $student->id,
            'gradeScore' => 98,
        ])->assertCreated();

        $verificationCode = $issueRes->json('data.verification_code');
        $this->assertNotEmpty($verificationCode);

        // 2. Public verification endpoint (Unauthenticated - anyone scanning the QR code)
        // Switch to guest
        $this->app['auth']->forgetGuards();

        $verifyRes = $this->getJson("/api/v1/public/certificates/verify/{$verificationCode}")
            ->assertOk()
            ->assertJson([
                'valid' => true,
                'certificate' => [
                    'verificationCode' => $verificationCode,
                    'gradeScore' => 98,
                    'studentName' => 'Tarek Student',
                ],
            ]);

        // 3. Invalid code returns 404
        $this->getJson('/api/v1/public/certificates/verify/INVALID-CODE-999')
            ->assertNotFound()
            ->assertJson(['valid' => false]);
    }

    public function test_room_discussions_and_comments(): void
    {
        $this->seed();
        [$org, $instructor] = $this->workspace('Design School');

        $room = Room::factory()->create([
            'organization_id' => $org->id,
            'name' => 'UI/UX Master Room',
        ]);

        RoomMembership::query()->create([
            'organization_id' => $org->id,
            'room_id' => $room->id,
            'user_id' => $instructor->id,
            'role' => 'instructor',
            'status' => 'active',
        ]);

        $student = User::factory()->create(['name' => 'Sara Designer']);
        RoomMembership::query()->create([
            'organization_id' => $org->id,
            'room_id' => $room->id,
            'user_id' => $student->id,
            'role' => 'member',
            'status' => 'active',
        ]);

        // Unauthorized user cannot post in room
        $unauthorized = User::factory()->create();
        Sanctum::actingAs($unauthorized);
        $this->postJson("/api/v1/rooms/{$room->id}/discussions", [
            'title' => 'Sneak question',
            'body' => 'I do not belong to this room.',
        ])->assertStatus(403);

        Sanctum::actingAs($student);

        // 1. Enrolled student posts a question in the room
        $discRes = $this->postJson("/api/v1/rooms/{$room->id}/discussions", [
            'title' => 'How to export SVGs cleanly in Figma?',
            'body' => 'I am experiencing scaling issues when exporting icons. Any tips?',
        ])->assertCreated();

        $discId = $discRes->json('data.id');
        $this->assertDatabaseHas('room_discussions', [
            'id' => $discId,
            'room_id' => $room->id,
            'title' => 'How to export SVGs cleanly in Figma?',
        ]);

        // 2. Instructor replies with certified instructor badge
        Sanctum::actingAs($instructor);

        $replyRes = $this->postJson("/api/v1/discussions/{$discId}/comments", [
            'body' => 'Make sure to outline your strokes before exporting with Ctrl+Shift+O.',
        ])->assertCreated();

        $this->assertTrue($replyRes->json('data.is_instructor_reply'));

        // 3. List discussions shows comments and user info
        $listRes = $this->getJson("/api/v1/rooms/{$room->id}/discussions")
            ->assertOk();
        $this->assertCount(1, $listRes->json('data'));
    }

    public function test_video_watch_progress_and_resume_tracking(): void
    {
        $this->seed();
        [$org, $instructor] = $this->workspace('Live Academy');
        $room = Room::factory()->create([
            'organization_id' => $org->id,
            'name' => 'Video Room',
        ]);
        RoomMembership::query()->create([
            'organization_id' => $org->id,
            'room_id' => $room->id,
            'user_id' => $instructor->id,
            'role' => 'instructor',
            'status' => 'active',
        ]);
        $student = User::factory()->create();
        RoomMembership::query()->create([
            'organization_id' => $org->id,
            'room_id' => $room->id,
            'user_id' => $student->id,
            'role' => 'member',
            'status' => 'active',
        ]);
        ContentItem::query()->create([
            'organization_id' => $org->id,
            'room_id' => $room->id,
            'created_by' => $instructor->id,
            'title' => 'Intro Video',
            'type' => 'video',
            'external_video_id' => 'lesson-video-intro-101',
            'status' => 'ready',
        ]);

        Sanctum::actingAs($student);

        // 1. Save partial progress (300 seconds out of 1000 seconds = 30%)
        $res1 = $this->postJson('/api/v1/video-progress', [
            'contentId' => 'lesson-video-intro-101',
            'watchedSeconds' => 300,
            'totalDurationSeconds' => 1000,
            'lastPositionSeconds' => 300,
        ])->assertOk();

        $this->assertEquals(30, $res1->json('data.completionPercentage'));
        $this->assertFalse($res1->json('data.isCompleted'));

        // 2. Fetch progress to verify resume position
        $getRes = $this->getJson('/api/v1/video-progress/lesson-video-intro-101')
            ->assertOk();
        $this->assertEquals(300, $getRes->json('data.lastPositionSeconds'));

        // 3. Save progress past completion threshold (880 seconds out of 1000 seconds = 88% >= 85%)
        $res2 = $this->postJson('/api/v1/video-progress', [
            'contentId' => 'lesson-video-intro-101',
            'watchedSeconds' => 880,
            'totalDurationSeconds' => 1000,
            'lastPositionSeconds' => 880,
        ])->assertOk();

        $this->assertTrue($res2->json('data.isCompleted'));
        $this->assertEquals(88, $res2->json('data.completionPercentage'));

        // 4. Unauthorized user cannot save progress (403)
        $unauthorized = User::factory()->create();
        Sanctum::actingAs($unauthorized);
        $this->postJson('/api/v1/video-progress', [
            'contentId' => 'lesson-video-intro-101',
            'watchedSeconds' => 100,
            'totalDurationSeconds' => 1000,
            'lastPositionSeconds' => 100,
        ])->assertStatus(403);

        // 5. Nonexistent content returns 404
        Sanctum::actingAs($student);
        $this->postJson('/api/v1/video-progress', [
            'contentId' => 'nonexistent-video-999',
            'watchedSeconds' => 100,
            'totalDurationSeconds' => 1000,
            'lastPositionSeconds' => 100,
        ])->assertNotFound();
    }

    public function test_live_meeting_scheduling_with_zoom(): void
    {
        $this->seed();
        [$org, $admin] = $this->workspace('Live Academy');

        Sanctum::actingAs($admin);

        // Schedule a Zoom meeting with explicit provider meeting link
        $schedRes = $this->postJson("/api/v1/organizations/{$org->id}/meetings/schedule", [
            'title' => 'Live Q&A Session with Instructor',
            'titleAr' => 'جلسة أسئلة وأجوبة مباشرة',
            'startsAt' => now()->addHours(2)->toIso8601String(),
            'endsAt' => now()->addHours(3)->toIso8601String(),
            'meetingProvider' => 'zoom',
            'meetingLink' => 'https://zoom.us/j/9876543210?pwd=secretpasscode',
            'meetingId' => '9876543210',
            'meetingPasscode' => 'secretpasscode',
        ])->assertCreated();

        $this->assertEquals('https://zoom.us/j/9876543210?pwd=secretpasscode', $schedRes->json('data.meeting_link'));
        $this->assertEquals('9876543210', $schedRes->json('data.meeting_id'));
        $this->assertEquals('secretpasscode', $schedRes->json('data.meeting_passcode'));
    }

    public function test_meeting_history_scope_returns_recent_completed_sessions(): void
    {
        $this->seed();
        [$org, $admin] = $this->workspace('Meeting History Academy');

        $completed = LearningSession::query()->create([
            'organization_id' => $org->id,
            'created_by' => $admin->id,
            'title' => 'Completed revision',
            'title_ar' => 'مراجعة مكتملة',
            'starts_at' => now()->subDays(2),
            'ends_at' => now()->subDays(2)->addHour(),
            'status' => 'completed',
            'meeting_provider' => 'zoom',
            'meeting_link' => 'https://zoom.us/j/1234567890',
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson("/api/v1/organizations/{$org->id}/meetings/upcoming?scope=all")
            ->assertOk();

        $this->assertContains($completed->id, collect($response->json('data'))->pluck('id')->all());
    }

    public function test_cannot_schedule_meeting_without_meeting_link(): void
    {
        $this->seed();
        [$org, $admin] = $this->workspace('Link Validation Academy');

        Sanctum::actingAs($admin);

        // Attempting to schedule without providing a real meeting link fails validation
        $res = $this->postJson("/api/v1/organizations/{$org->id}/meetings/schedule", [
            'title' => 'Meeting Without Link',
            'startsAt' => now()->addHours(2)->toIso8601String(),
            'endsAt' => now()->addHours(3)->toIso8601String(),
            'meetingProvider' => 'zoom',
        ])->assertStatus(422);

        $this->assertEquals('VALIDATION_ERROR', $res->json('error.code'));
        $this->assertArrayHasKey('meetingLink', $res->json('error.details.fields'));
    }

    public function test_cannot_schedule_meeting_using_batch_from_another_organization(): void
    {
        $this->seed();
        [$orgA, $adminA] = $this->workspace('Live Org A');
        [$orgB, $adminB] = $this->workspace('Live Org B');

        $roomB = Room::factory()->create(['organization_id' => $orgB->id]);
        $courseB = Course::factory()->create([
            'organization_id' => $orgB->id,
            'created_by' => $adminB->id,
        ]);
        $batchB = CourseBatch::query()->create([
            'organization_id' => $orgB->id,
            'course_id' => $courseB->id,
            'room_id' => $roomB->id,
            'title' => 'Org B Batch',
            'start_date' => now()->addDays(5)->toDateString(),
            'end_date' => now()->addMonths(2)->toDateString(),
            'delivery_type' => 'online',
            'schedule' => [['day' => 'Monday', 'startTime' => '10:00', 'endTime' => '12:00']],
            'capacity' => 20,
            'status' => 'open',
        ]);

        Sanctum::actingAs($adminA);

        // Attempt to schedule meeting in Org A using batch from Org B
        $res = $this->postJson("/api/v1/organizations/{$orgA->id}/meetings/schedule", [
            'title' => 'Cross-Tenant Batch Exploit',
            'batchId' => $batchB->id,
            'startsAt' => now()->addHours(2)->toIso8601String(),
            'endsAt' => now()->addHours(3)->toIso8601String(),
            'meetingProvider' => 'zoom',
            'meetingLink' => 'https://zoom.us/j/1234567890?pwd=pass',
        ])->assertStatus(422);

        $this->assertEquals('VALIDATION_ERROR', $res->json('error.code'));
        $this->assertArrayHasKey('batchId', $res->json('error.details.fields'));
    }

    protected function workspace(string $name): array
    {
        $org = Organization::factory()->create([
            'name' => $name,
            'status' => 'active',
        ]);

        $admin = User::factory()->create([
            'email' => strtolower(str_replace(' ', '', $name)).'@ain.edu',
        ]);

        $ownerRole = Role::query()->where('name', OrganizationRole::Owner->value)->firstOrFail();

        OrganizationMembership::create([
            'organization_id' => $org->id,
            'user_id' => $admin->id,
            'role_id' => $ownerRole->id,
            'status' => 'active',
        ]);

        $plan = Plan::query()->where('code', 'growth')->first()
            ?? Plan::query()->firstOrCreate(['code' => 'pro'], [
                'name' => 'Pro Plan',
                'monthly_price_minor' => 9900,
                'yearly_price_minor' => 99000,
                'currency' => 'EGP',
                'active' => true,
            ]);

        OrganizationSubscription::create([
            'organization_id' => $org->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'starts_at' => now(),
            'current_period_starts_at' => now(),
            'current_period_ends_at' => now()->addMonth(),
            'trial_ends_at' => now()->addMonth(),
        ]);

        return [$org, $admin];
    }
}
