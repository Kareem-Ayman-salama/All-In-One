<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\OrganizationSubscription;
use App\Models\Plan;
use App\Models\Role;
use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ContentSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_valid_pdf_is_stored_on_the_private_disk(): void
    {
        Storage::fake('local');
        [$organization, $owner, $room] = $this->workspace();
        Sanctum::actingAs($owner);

        $response = $this->post(
            "/api/v1/organizations/{$organization->id}/content",
            [
                'roomId' => $room->id,
                'title' => 'Physics notes',
                'type' => 'pdf',
                'file' => UploadedFile::fake()->createWithContent(
                    'physics.pdf',
                    "%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF",
                ),
            ],
            ['Accept' => 'application/json'],
        );

        $response->assertCreated()
            ->assertJsonPath('data.type', 'pdf')
            ->assertJsonPath('data.file_asset.mime_type', 'application/pdf');

        $assetPath = $response->json('data.file_asset.path');
        Storage::disk('local')->assertExists($assetPath);
    }

    public function test_mobile_view_session_returns_short_lived_signed_url(): void
    {
        Storage::fake('local');
        [$organization, $owner, $room] = $this->workspace();
        Sanctum::actingAs($owner);

        $upload = $this->post(
            "/api/v1/organizations/{$organization->id}/content",
            [
                'roomId' => $room->id,
                'title' => 'Mobile PDF',
                'type' => 'pdf',
                'file' => UploadedFile::fake()->createWithContent(
                    'mobile.pdf',
                    "%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF",
                ),
            ],
            ['Accept' => 'application/json'],
        );
        $contentId = $upload->json('data.id');

        $session = $this->getJson(
            "/api/v1/organizations/{$organization->id}/content/{$contentId}/view-session",
        );

        $session->assertOk()
            ->assertJsonPath('data.mimeType', 'application/pdf')
            ->assertJsonPath('data.downloadAllowed', false)
            ->assertJsonPath('data.watermark.enabled', true)
            ->assertJsonStructure([
                'data' => ['url', 'expiresAt', 'sizeBytes', 'status'],
            ]);

        $this->get($session->json('data.url'))
            ->assertOk()
            ->assertHeader('X-Content-Type-Options', 'nosniff');

        $this->assertDatabaseHas('content_access_logs', [
            'organization_id' => $organization->id,
            'content_item_id' => $contentId,
            'user_id' => $owner->id,
            'action' => 'view_session',
            'result' => 'allowed',
        ]);
    }

    public function test_direct_content_view_requires_a_valid_signature(): void
    {
        Storage::fake('local');
        [$organization, $owner, $room] = $this->workspace();
        Sanctum::actingAs($owner);

        $upload = $this->post(
            "/api/v1/organizations/{$organization->id}/content",
            [
                'roomId' => $room->id,
                'title' => 'Unsigned PDF',
                'type' => 'pdf',
                'file' => UploadedFile::fake()->createWithContent(
                    'unsigned.pdf',
                    "%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF",
                ),
            ],
            ['Accept' => 'application/json'],
        );

        $this->get("/api/v1/content-view/{$upload->json('data.id')}")
            ->assertForbidden();
    }

    public function test_content_view_session_requires_same_organization_access(): void
    {
        Storage::fake('local');
        [$organization, $owner, $room] = $this->workspace();
        $otherUser = User::factory()->create();
        $otherOrganization = Organization::query()->create([
            'name' => 'Other Academy',
            'slug' => 'other-academy',
            'type' => 'academy',
        ]);
        $role = Role::query()
            ->whereNull('organization_id')
            ->where('name', 'organization_owner')
            ->firstOrFail();
        OrganizationMembership::query()->create([
            'organization_id' => $otherOrganization->id,
            'user_id' => $otherUser->id,
            'role_id' => $role->id,
            'status' => 'active',
            'joined_at' => now(),
        ]);
        OrganizationSubscription::query()->create([
            'organization_id' => $otherOrganization->id,
            'plan_id' => Plan::query()->where('code', 'growth')->firstOrFail()->id,
            'status' => 'active',
            'billing_interval' => 'monthly',
            'current_period_starts_at' => now(),
            'current_period_ends_at' => now()->addMonth(),
        ]);

        Sanctum::actingAs($owner);
        $upload = $this->post(
            "/api/v1/organizations/{$organization->id}/content",
            [
                'roomId' => $room->id,
                'title' => 'Tenant scoped PDF',
                'type' => 'pdf',
                'file' => UploadedFile::fake()->createWithContent(
                    'tenant.pdf',
                    "%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF",
                ),
            ],
            ['Accept' => 'application/json'],
        );

        Sanctum::actingAs($otherUser);
        $this->getJson(
            "/api/v1/organizations/{$otherOrganization->id}/content/{$upload->json('data.id')}/view-session",
        )
            ->assertNotFound()
            ->assertJsonPath('error.code', 'RESOURCE_NOT_FOUND');
    }

    public function test_youtube_content_stores_video_id_and_returns_playback_config(): void
    {
        [$organization, $owner, $room] = $this->workspace();
        Sanctum::actingAs($owner);

        $response = $this->postJson(
            "/api/v1/organizations/{$organization->id}/content",
            [
                'roomId' => $room->id,
                'title' => 'YouTube lesson',
                'type' => 'youtube',
                'externalUrl' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'allowFullscreen' => false,
            ],
        );

        $contentId = $response
            ->assertCreated()
            ->assertJsonPath('data.type', 'youtube')
            ->assertJsonPath('data.video_provider', 'youtube')
            ->assertJsonPath('data.external_video_id', 'dQw4w9WgXcQ')
            ->assertJsonMissingPath('data.external_url_encrypted')
            ->json('data.id');

        $this->assertDatabaseHas('content_items', [
            'id' => $contentId,
            'external_url' => null,
            'video_provider' => 'youtube',
            'external_video_id' => 'dQw4w9WgXcQ',
            'allow_fullscreen' => false,
        ]);

        $session = $this->getJson(
            "/api/v1/organizations/{$organization->id}/content/{$contentId}/view-session",
        );

        $session->assertOk()
            ->assertJsonPath('data.playbackType', 'youtube')
            ->assertJsonPath('data.provider', 'youtube')
            ->assertJsonPath('data.videoId', 'dQw4w9WgXcQ')
            ->assertJsonPath('data.allowFullscreen', false)
            ->assertJsonPath('data.downloadAllowed', false)
            ->assertJsonPath('data.watermark.enabled', true)
            ->assertJsonStructure([
                'data' => [
                    'embedUrl',
                    'expiresAt',
                    'viewerSessionId',
                    'watermark' => ['maskedEmail', 'moveEverySeconds'],
                ],
            ]);
    }

    public function test_youtube_content_rejects_non_youtube_urls(): void
    {
        [$organization, $owner, $room] = $this->workspace();
        Sanctum::actingAs($owner);

        $this->postJson(
            "/api/v1/organizations/{$organization->id}/content",
            [
                'roomId' => $room->id,
                'title' => 'Bad video',
                'type' => 'youtube',
                'externalUrl' => 'https://example.com/watch?v=dQw4w9WgXcQ',
            ],
        )
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'INVALID_YOUTUBE_URL');
    }

    public function test_mobile_view_session_rejects_unavailable_content(): void
    {
        Storage::fake('local');
        [$organization, $owner, $room] = $this->workspace();
        Sanctum::actingAs($owner);

        $upload = $this->post(
            "/api/v1/organizations/{$organization->id}/content",
            [
                'roomId' => $room->id,
                'title' => 'Future PDF',
                'type' => 'pdf',
                'availableFrom' => now()->addDay()->toIso8601String(),
                'availableUntil' => now()->addDays(2)->toIso8601String(),
                'file' => UploadedFile::fake()->createWithContent(
                    'future.pdf',
                    "%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF",
                ),
            ],
            ['Accept' => 'application/json'],
        );
        $contentId = $upload->json('data.id');

        $this->getJson(
            "/api/v1/organizations/{$organization->id}/content/{$contentId}/view-session",
        )
            ->assertForbidden()
            ->assertJsonPath('error.code', 'CONTENT_ACCESS_EXPIRED');
    }

    public function test_mobile_viewer_audit_event_is_logged(): void
    {
        Storage::fake('local');
        [$organization, $owner, $room] = $this->workspace();
        Sanctum::actingAs($owner);

        $upload = $this->post(
            "/api/v1/organizations/{$organization->id}/content",
            [
                'roomId' => $room->id,
                'title' => 'Audited PDF',
                'type' => 'pdf',
                'file' => UploadedFile::fake()->createWithContent(
                    'audited.pdf',
                    "%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF",
                ),
            ],
            ['Accept' => 'application/json'],
        );
        $contentId = $upload->json('data.id');

        $this->postJson(
            "/api/v1/organizations/{$organization->id}/content/{$contentId}/viewer-audit",
            [
                'event' => 'download_blocked',
                'viewerSessionId' => 'viewer-session-1',
                'page' => 3,
                'message' => 'Download button disabled by policy.',
            ],
        )
            ->assertCreated()
            ->assertJsonPath('data.logged', true);

        $this->assertDatabaseHas('content_access_logs', [
            'organization_id' => $organization->id,
            'content_item_id' => $contentId,
            'user_id' => $owner->id,
            'action' => 'viewer_download_blocked',
            'result' => 'warning',
        ]);
    }

    public function test_web_viewer_blocked_actions_are_logged(): void
    {
        Storage::fake('local');
        [$organization, $owner, $room] = $this->workspace();
        Sanctum::actingAs($owner);

        $upload = $this->post(
            "/api/v1/organizations/{$organization->id}/content",
            [
                'roomId' => $room->id,
                'title' => 'Protected lesson',
                'type' => 'pdf',
                'file' => UploadedFile::fake()->createWithContent(
                    'protected.pdf',
                    "%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF",
                ),
            ],
            ['Accept' => 'application/json'],
        );
        $contentId = $upload->json('data.id');

        $this->postJson(
            "/api/v1/organizations/{$organization->id}/content/{$contentId}/viewer-audit",
            [
                'event' => 'right_click_blocked',
                'viewerSessionId' => 'web-session-1',
                'message' => 'Right click blocked in web content viewer.',
            ],
        )
            ->assertCreated()
            ->assertJsonPath('data.logged', true);

        $this->postJson(
            "/api/v1/organizations/{$organization->id}/content/{$contentId}/viewer-audit",
            [
                'event' => 'shortcut_blocked',
                'viewerSessionId' => 'web-session-1',
                'message' => 'Blocked shortcut: s',
            ],
        )
            ->assertCreated()
            ->assertJsonPath('data.logged', true);

        $this->assertDatabaseHas('content_access_logs', [
            'organization_id' => $organization->id,
            'content_item_id' => $contentId,
            'user_id' => $owner->id,
            'action' => 'viewer_right_click_blocked',
            'result' => 'warning',
        ]);
        $this->assertDatabaseHas('content_access_logs', [
            'organization_id' => $organization->id,
            'content_item_id' => $contentId,
            'user_id' => $owner->id,
            'action' => 'viewer_shortcut_blocked',
            'result' => 'warning',
        ]);
    }

    public function test_html_disguised_as_pdf_is_rejected(): void
    {
        [$organization, $owner, $room] = $this->workspace();
        Sanctum::actingAs($owner);

        $this->post(
            "/api/v1/organizations/{$organization->id}/content",
            [
                'roomId' => $room->id,
                'title' => 'Unsafe upload',
                'type' => 'pdf',
                'file' => UploadedFile::fake()->createWithContent(
                    'report.pdf',
                    '<html><script>alert(1)</script></html>',
                ),
            ],
            ['Accept' => 'application/json'],
        )
            ->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR');
    }

    public function test_double_extension_executable_is_rejected(): void
    {
        [$organization, $owner, $room] = $this->workspace();
        Sanctum::actingAs($owner);

        $this->post(
            "/api/v1/organizations/{$organization->id}/content",
            [
                'roomId' => $room->id,
                'title' => 'Unsafe upload',
                'type' => 'pdf',
                'file' => UploadedFile::fake()->createWithContent(
                    'payload.php.pdf',
                    '<?php echo "unsafe";',
                ),
            ],
            ['Accept' => 'application/json'],
        )
            ->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR');
    }

    public function test_declared_content_type_must_match_the_file(): void
    {
        [$organization, $owner, $room] = $this->workspace();
        Sanctum::actingAs($owner);

        $this->post(
            "/api/v1/organizations/{$organization->id}/content",
            [
                'roomId' => $room->id,
                'title' => 'Mismatched upload',
                'type' => 'image',
                'file' => UploadedFile::fake()->createWithContent(
                    'notes.pdf',
                    "%PDF-1.4\n%%EOF",
                ),
            ],
            ['Accept' => 'application/json'],
        )
            ->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR');
    }

    /**
     * @return array{Organization, User, Room}
     */
    private function workspace(): array
    {
        $this->seed();
        $owner = User::factory()->create();
        $organization = Organization::query()->create([
            'name' => 'Secure Academy',
            'slug' => 'secure-academy',
            'type' => 'academy',
        ]);
        $role = Role::query()
            ->whereNull('organization_id')
            ->where('name', 'organization_owner')
            ->firstOrFail();
        OrganizationMembership::query()->create([
            'organization_id' => $organization->id,
            'user_id' => $owner->id,
            'role_id' => $role->id,
            'status' => 'active',
            'joined_at' => now(),
        ]);
        OrganizationSubscription::query()->create([
            'organization_id' => $organization->id,
            'plan_id' => Plan::query()->where('code', 'growth')->firstOrFail()->id,
            'status' => 'active',
            'billing_interval' => 'monthly',
            'current_period_starts_at' => now(),
            'current_period_ends_at' => now()->addMonth(),
        ]);
        $room = Room::query()->create([
            'organization_id' => $organization->id,
            'created_by' => $owner->id,
            'name' => 'Secure room',
            'slug' => 'secure-room',
            'status' => 'active',
        ]);

        return [$organization, $owner, $room];
    }
}
