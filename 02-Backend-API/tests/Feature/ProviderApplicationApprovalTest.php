<?php

namespace Tests\Feature;

use App\Models\ProviderApplication;
use App\Models\User;
use App\Services\Security\Malware\MockScanner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProviderApplicationApprovalTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
        Storage::fake('local');
        Notification::fake();
    }

    public function test_verified_teacher_submits_application_instead_of_creating_workspace(): void
    {
        $teacher = User::factory()->create();
        Sanctum::actingAs($teacher);

        $this->post('/api/v1/provider-applications', $this->payload())
            ->assertCreated()
            ->assertJsonPath('data.status', ProviderApplication::STATUS_PENDING_REVIEW)
            ->assertJsonPath('data.display_name', 'Ahmed Hassan')
            ->assertJsonCount(2, 'data.documents');

        $this->assertDatabaseHas('provider_applications', [
            'user_id' => $teacher->id,
            'status' => ProviderApplication::STATUS_PENDING_REVIEW,
        ]);
        $this->assertDatabaseMissing('organizations', [
            'type' => 'independent_instructor',
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'actor_id' => $teacher->id,
            'action' => 'provider_application.submitted',
        ]);
    }

    public function test_teacher_can_resubmit_after_requested_changes(): void
    {
        $teacher = User::factory()->create();
        $admin = User::factory()->create();
        $admin->forceFill(['platform_role' => 'super_admin'])->save();
        Sanctum::actingAs($teacher);
        $applicationId = $this->post('/api/v1/provider-applications', $this->payload())
            ->assertCreated()
            ->json('data.id');

        Sanctum::actingAs($admin);
        $this->postJson("/api/v1/admin/provider-applications/{$applicationId}/request-changes", [
            'note' => 'Please add clearer experience details.',
        ])
            ->assertOk()
            ->assertJsonPath('data.status', ProviderApplication::STATUS_NEEDS_CHANGES);

        Sanctum::actingAs($teacher);
        $payload = $this->payload(includeDocuments: false);
        $payload['bio'] = str_repeat('Updated teaching experience and methodology. ', 2);
        $this->post('/api/v1/provider-applications', $payload)
            ->assertCreated()
            ->assertJsonPath('data.status', ProviderApplication::STATUS_PENDING_REVIEW)
            ->assertJsonPath('data.review_note', null)
            ->assertJsonCount(2, 'data.documents');
    }

    public function test_platform_moderator_can_approve_and_create_instructor_workspace(): void
    {
        $teacher = User::factory()->create();
        $moderator = User::factory()->create();
        $moderator->forceFill(['platform_role' => 'platform_moderator'])->save();
        Sanctum::actingAs($teacher);
        $applicationId = $this->post('/api/v1/provider-applications', $this->payload())
            ->assertCreated()
            ->json('data.id');

        Sanctum::actingAs($moderator);
        $this->postJson("/api/v1/admin/provider-applications/{$applicationId}/approve", [
            'note' => 'Identity and teaching profile verified.',
        ])
            ->assertOk()
            ->assertJsonPath('data.status', ProviderApplication::STATUS_APPROVED)
            ->assertJsonPath('data.organization.type', 'independent_instructor')
            ->assertJsonPath('data.organization.status', 'active');

        $application = ProviderApplication::query()->findOrFail($applicationId);
        $this->assertNotNull($application->organization_id);
        $this->assertDatabaseHas('organization_memberships', [
            'organization_id' => $application->organization_id,
            'user_id' => $teacher->id,
            'status' => 'active',
        ]);
        $this->assertDatabaseHas('academy_profiles', [
            'organization_id' => $application->organization_id,
            'verification_status' => 'verified',
            'is_public' => true,
        ]);
        $this->assertDatabaseHas('instructors', [
            'organization_id' => $application->organization_id,
            'user_id' => $teacher->id,
            'status' => 'active',
        ]);
        $this->assertDatabaseHas('notifications', [
            'user_id' => $teacher->id,
            'type' => 'provider_application_status',
        ]);
    }

    public function test_direct_independent_instructor_workspace_creation_is_blocked(): void
    {
        $teacher = User::factory()->create();
        Sanctum::actingAs($teacher);

        $this->postJson('/api/v1/organizations', [
            'name' => 'Bypass Attempt',
            'type' => 'independent_instructor',
        ])
            ->assertUnprocessable();

        $this->assertDatabaseMissing('organizations', [
            'name' => 'Bypass Attempt',
        ]);
    }

    public function test_unverified_account_and_infected_documents_are_rejected(): void
    {
        $unverified = User::factory()->unverified()->create();
        Sanctum::actingAs($unverified);
        $this->post('/api/v1/provider-applications', $this->payload())
            ->assertForbidden();

        $verified = User::factory()->create();
        Sanctum::actingAs($verified);
        MockScanner::fakeInfected();
        $this->post('/api/v1/provider-applications', $this->payload())
            ->assertUnprocessable()
            ->assertJsonPath('error.code', 'MALWARE_DETECTED');
        $this->assertDatabaseMissing('provider_applications', [
            'user_id' => $verified->id,
        ]);
    }

    public function test_regular_user_cannot_review_provider_applications(): void
    {
        $teacher = User::factory()->create();
        Sanctum::actingAs($teacher);
        $applicationId = $this->post('/api/v1/provider-applications', $this->payload())
            ->assertCreated()
            ->json('data.id');

        $regularUser = User::factory()->create();
        Sanctum::actingAs($regularUser);
        $this->getJson('/api/v1/admin/provider-applications')
            ->assertForbidden();
        $this->postJson("/api/v1/admin/provider-applications/{$applicationId}/approve")
            ->assertForbidden();
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(bool $includeDocuments = true): array
    {
        $payload = [
            'providerType' => 'independent_instructor',
            'displayName' => 'Ahmed Hassan',
            'phone' => '01012345678',
            'specialty' => 'Mathematics',
            'yearsExperience' => 6,
            'bio' => str_repeat('Experienced mathematics instructor for secondary students. ', 2),
            'qualifications' => 'Faculty of Education, Mathematics Department.',
            'portfolioUrl' => 'https://example.com/ahmed',
            'sampleCourseTitle' => 'Secondary Mathematics Foundation',
            'sampleCourseDescription' => 'A structured course for secondary students.',
        ];

        if ($includeDocuments) {
            $payload['identityDocument'] = UploadedFile::fake()->create(
                'identity.pdf',
                120,
                'application/pdf',
            );
            $payload['qualificationDocument'] = UploadedFile::fake()->create(
                'certificate.pdf',
                160,
                'application/pdf',
            );
        }

        return $payload;
    }
}
