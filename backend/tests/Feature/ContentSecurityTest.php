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
