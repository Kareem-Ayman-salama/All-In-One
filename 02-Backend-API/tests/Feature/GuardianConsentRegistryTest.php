<?php

namespace Tests\Feature;

use App\Domain\Tenancy\Enums\OrganizationRole;
use App\Models\GuardianConsent;
use App\Models\GuardianStudentLink;
use App\Models\Instructor;
use App\Models\InstructorAvailabilitySlot;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\OrganizationSubscription;
use App\Models\Plan;
use App\Models\Role;
use App\Models\Room;
use App\Models\RoomMembership;
use App\Models\User;
use App\Models\VerificationCode;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GuardianConsentRegistryTest extends TestCase
{
    use RefreshDatabase;

    public function test_minor_student_is_blocked_from_posting_discussions_without_guardian_consent(): void
    {
        $this->seed();
        [$org, $admin] = $this->workspace('Cairo STEM Academy');

        // Minor student (age 15)
        $student = User::factory()->create([
            'name' => 'Youssef Minor',
            'email' => 'youssef@minor.test',
            'is_minor' => true,
            'date_of_birth' => now()->subYears(15)->format('Y-m-d'),
        ]);

        $room = Room::query()->create([
            'organization_id' => $org->id,
            'created_by' => $admin->id,
            'name' => 'Grade 10 Physics',
            'slug' => 'grade-10-physics',
            'status' => 'active',
        ]);

        RoomMembership::query()->create([
            'organization_id' => $org->id,
            'room_id' => $room->id,
            'user_id' => $student->id,
            'role' => 'student',
            'status' => 'active',
            'joined_at' => now(),
        ]);

        Sanctum::actingAs($student);

        // Minor tries to post discussion
        $response = $this->postJson("/api/v1/rooms/{$room->id}/discussions", [
            'title' => 'Question about Newton Law',
            'body' => 'Can someone explain the third law experiment?',
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('error.code', 'GUARDIAN_CONSENT_REQUIRED');
    }

    public function test_guardian_can_request_and_verify_consent_with_otp_to_unblock_minor(): void
    {
        $this->seed();
        [$org, $admin] = $this->workspace('Cairo STEM Academy');

        $student = User::factory()->create([
            'name' => 'Salma Minor',
            'email' => 'salma@minor.test',
            'is_minor' => true,
            'date_of_birth' => now()->subYears(14)->format('Y-m-d'),
        ]);

        $guardian = User::factory()->create([
            'name' => 'Mohamed Parent',
            'email' => 'mohamed.parent@family.test',
            'email_verified_at' => now(),
        ]);

        GuardianStudentLink::query()->create([
            'organization_id' => $org->id,
            'guardian_id' => $guardian->id,
            'student_id' => $student->id,
            'status' => 'active',
            'relationship' => 'father',
        ]);

        $room = Room::query()->create([
            'organization_id' => $org->id,
            'created_by' => $admin->id,
            'name' => 'Chemistry Lab',
            'slug' => 'chemistry-lab',
            'status' => 'active',
        ]);

        RoomMembership::query()->create([
            'organization_id' => $org->id,
            'room_id' => $room->id,
            'user_id' => $student->id,
            'role' => 'student',
            'status' => 'active',
            'joined_at' => now(),
        ]);

        // 1. Guardian requests consent
        Sanctum::actingAs($guardian);

        $requestRes = $this->postJson('/api/v1/guardian/consents/request', [
            'student_id' => $student->id,
            'organization_id' => $org->id,
            'terms_version' => 'v1.0-2026',
        ])->assertStatus(201);

        $consentId = $requestRes->json('data.consent.id');
        $this->assertNotEmpty($consentId);
        $this->assertEquals('pending', $requestRes->json('data.consent.status'));

        // Retrieve generated OTP from DB for testing
        $verification = VerificationCode::query()
            ->where('email', $guardian->normalized_email)
            ->where('purpose', 'guardian_consent')
            ->whereNull('used_at')
            ->firstOrFail();

        $otpCode = $requestRes->json('data.code');
        $this->assertNotEmpty($otpCode);

        // 2. Guardian submits OTP to approve consent
        $verifyRes = $this->postJson("/api/v1/guardian/consents/{$consentId}/verify-otp", [
            'code' => $otpCode,
        ])->assertOk();

        $this->assertEquals('approved', $verifyRes->json('data.status'));
        $this->assertNotNull($verifyRes->json('data.consented_at'));
        $this->assertNotNull($verifyRes->json('data.expires_at'));
        $this->assertEquals('v1.0-2026', $verifyRes->json('data.terms_version'));
        $this->assertNotEmpty($verifyRes->json('data.terms_content_hash'));

        // 3. Minor student can now post discussions and comments
        Sanctum::actingAs($student);

        $discRes = $this->postJson("/api/v1/rooms/{$room->id}/discussions", [
            'title' => 'Periodic Table Discussion',
            'body' => 'I have completed reading chapter 2 of the periodic table.',
        ])->assertStatus(201);

        $discId = $discRes->json('data.id');

        // Commenting is also permitted
        $this->postJson("/api/v1/discussions/{$discId}/comments", [
            'body' => 'Thank you for the notes!',
        ])->assertStatus(201);

        // 4. Student checks their consent status
        $statusRes = $this->getJson('/api/v1/student/guardian-consent-status')->assertOk();
        $this->assertTrue($statusRes->json('data.isMinor'));
        $this->assertTrue($statusRes->json('data.hasActiveConsent'));
        $this->assertEquals('approved', $statusRes->json('data.activeConsent.status'));
    }

    public function test_guardian_can_revoke_consent_and_minor_is_immediately_reblocked(): void
    {
        $this->seed();
        [$org, $admin] = $this->workspace('Cairo STEM Academy');

        $student = User::factory()->create([
            'name' => 'Tarek Minor',
            'email' => 'tarek@minor.test',
            'is_minor' => true,
        ]);

        $guardian = User::factory()->create([
            'name' => 'Amr Parent',
            'email' => 'amr.parent@family.test',
            'email_verified_at' => now(),
        ]);

        // Pre-create approved consent
        $consent = GuardianConsent::query()->create([
            'organization_id' => $org->id,
            'guardian_id' => $guardian->id,
            'student_id' => $student->id,
            'status' => 'approved',
            'terms_version' => 'v1.0-2026',
            'consented_at' => now(),
            'expires_at' => now()->addYear(),
        ]);

        $room = Room::query()->create([
            'organization_id' => $org->id,
            'created_by' => $admin->id,
            'name' => 'Math Room',
            'slug' => 'math-room',
            'status' => 'active',
        ]);

        RoomMembership::query()->create([
            'organization_id' => $org->id,
            'room_id' => $room->id,
            'user_id' => $student->id,
            'role' => 'student',
            'status' => 'active',
            'joined_at' => now(),
        ]);

        // Guardian revokes consent
        Sanctum::actingAs($guardian);

        $revokeRes = $this->postJson("/api/v1/guardian/consents/{$consent->id}/revoke", [
            'reason' => 'Parent requested pause of extracurricular activities.',
        ])->assertOk();

        $this->assertEquals('revoked', $revokeRes->json('data.status'));
        $this->assertNotNull($revokeRes->json('data.revoked_at'));

        // Minor student is immediately blocked
        Sanctum::actingAs($student);

        $this->postJson("/api/v1/rooms/{$room->id}/discussions", [
            'title' => 'Math question',
            'body' => 'Can we solve problem 4 together?',
        ])->assertStatus(403)
            ->assertJsonPath('error.code', 'GUARDIAN_CONSENT_REQUIRED');
    }

    public function test_adult_student_is_not_blocked_and_requires_no_guardian_consent(): void
    {
        $this->seed();
        [$org, $admin] = $this->workspace('Cairo STEM Academy');

        // Adult student (age 22)
        $adultStudent = User::factory()->create([
            'name' => 'Omar Adult',
            'email' => 'omar.adult@university.test',
            'is_minor' => false,
            'date_of_birth' => now()->subYears(22)->format('Y-m-d'),
        ]);

        $room = Room::query()->create([
            'organization_id' => $org->id,
            'created_by' => $admin->id,
            'name' => 'Advanced Algorithms',
            'slug' => 'advanced-algorithms',
            'status' => 'active',
        ]);

        RoomMembership::query()->create([
            'organization_id' => $org->id,
            'room_id' => $room->id,
            'user_id' => $adultStudent->id,
            'role' => 'student',
            'status' => 'active',
            'joined_at' => now(),
        ]);

        Sanctum::actingAs($adultStudent);

        // Adult posts discussion successfully without guardian consent
        $this->postJson("/api/v1/rooms/{$room->id}/discussions", [
            'title' => 'Graph Search Questions',
            'body' => 'Discussing Dijkstra vs A* implementation.',
        ])->assertStatus(201);

        // Adult status check
        $statusRes = $this->getJson('/api/v1/student/guardian-consent-status')->assertOk();
        $this->assertFalse($statusRes->json('data.isMinor'));
        $this->assertFalse($statusRes->json('data.consentRequired'));
        $this->assertTrue($statusRes->json('data.hasActiveConsent'));
    }

    public function test_minor_blocked_from_lesson_booking_without_guardian_consent(): void
    {
        $this->seed();
        [$org, $admin] = $this->workspace('Cairo STEM Academy');

        $minorStudent = User::factory()->create([
            'name' => 'Nour Minor',
            'email' => 'nour@minor.test',
            'is_minor' => true,
        ]);

        $instructorUser = User::factory()->create(['name' => 'Dr. Hany']);
        $instructor = Instructor::query()->create([
            'organization_id' => $org->id,
            'user_id' => $instructorUser->id,
            'name' => 'Dr. Hany',
            'bio' => 'Mathematics professor',
            'status' => 'active',
        ]);

        $slot = InstructorAvailabilitySlot::query()->create([
            'organization_id' => $org->id,
            'instructor_id' => $instructor->id,
            'starts_at' => now()->addDays(2),
            'ends_at' => now()->addDays(2)->addHour(),
            'delivery_type' => 'online',
            'price_minor' => 20000,
            'currency' => 'EGP',
            'status' => 'open',
        ]);

        Sanctum::actingAs($minorStudent);

        $this->postJson('/api/v1/student/lesson-bookings', [
            'slotId' => $slot->id,
            'subject' => 'Calculus Private Session',
            'studentPhone' => '+201001234567',
        ])->assertStatus(403)
            ->assertJsonPath('error.code', 'GUARDIAN_CONSENT_REQUIRED');
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
