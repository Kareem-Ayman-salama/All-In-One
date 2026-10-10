<?php

namespace Tests\Feature;

use App\Models\AccountDeletionRequest;
use App\Models\Booking;
use App\Models\ContentItem;
use App\Models\Course;
use App\Models\CourseBatch;
use App\Models\FileAsset;
use App\Models\Instructor;
use App\Models\InstructorAvailabilitySlot;
use App\Models\LessonBooking;
use App\Models\Notification;
use App\Models\NotificationPreference;
use App\Models\Organization;
use App\Models\Payment;
use App\Models\PushDeviceToken;
use App\Models\Room;
use App\Models\SupportRequest;
use App\Models\User;
use App\Models\UserDevice;
use App\Models\UserSession;
use App\Models\VerificationCode;
use Illuminate\Console\Command;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AccountDeletionExecutionTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_export_complete_personal_data(): void
    {
        $this->seed();
        $user = User::factory()->create([
            'name' => 'Data Subject',
            'email' => 'datasubject@example.com',
            'avatar_path' => 'avatars/subject.jpg',
        ]);
        $organization = Organization::query()->first()
            ?? Organization::query()->create([
                'name' => 'Privacy Export Academy',
                'slug' => 'privacy-export-academy',
            ]);
        $device = UserDevice::query()->create([
            'user_id' => $user->id,
            'organization_id' => $organization->id,
            'device_hash' => hash('sha256', 'privacy-export-device'),
            'device_name' => 'Export Test Device',
            'status' => 'active',
        ]);
        $session = UserSession::query()->create([
            'user_id' => $user->id,
            'user_device_id' => $device->id,
            'name' => 'Export Test Session',
            'refresh_token_hash' => hash('sha256', 'privacy-export-refresh-token'),
            'expires_at' => now()->addDay(),
        ]);
        Payment::query()->create([
            'organization_id' => $organization->id,
            'user_id' => $user->id,
            'provider' => 'test',
            'provider_reference' => 'export-reference',
            'idempotency_key' => 'privacy-export-secret-key',
            'amount_minor' => 1000,
            'currency' => 'EGP',
            'status' => 'paid',
            'metadata' => ['provider_secret' => 'must-not-be-exported'],
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/privacy/export')
            ->assertOk()
            ->assertJsonPath('data.profile.email', 'datasubject@example.com')
            ->assertJsonStructure([
                'data' => [
                    'generatedAt',
                    'profile' => ['id', 'name', 'email', 'locale', 'timezone', 'avatarPath', 'status', 'createdAt'],
                    'memberships',
                    'bookings',
                    'lessonBookings',
                    'enrollments',
                    'payments',
                    'invoices',
                    'attendanceRecords',
                    'quizAttempts',
                    'assignmentSubmissions',
                    'watchProgress',
                    'devices',
                    'sessions',
                    'supportRequests',
                    'notifications',
                    'contentAccessLogs',
                ],
            ]);

        $this->assertSame('datasubject@example.com', $response->json('data.profile.email'));
        $response
            ->assertJsonPath('data.devices.0.id', $device->id)
            ->assertJsonMissingPath('data.devices.0.device_hash')
            ->assertJsonPath('data.sessions.0.id', $session->id)
            ->assertJsonMissingPath('data.sessions.0.refresh_token_hash')
            ->assertJsonMissingPath('data.payments.0.idempotency_key')
            ->assertJsonMissingPath('data.payments.0.metadata');
    }

    public function test_user_can_request_and_cancel_account_deletion(): void
    {
        $this->seed();
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        // 1. Request deletion
        $response = $this->postJson('/api/v1/privacy/deletion', [
            'reason' => 'I am graduating and moving abroad',
        ])->assertAccepted();

        $this->assertSame('pending', $response->json('data.status'));
        $this->assertDatabaseHas('account_deletion_requests', [
            'user_id' => $user->id,
            'status' => 'pending',
            'reason' => 'I am graduating and moving abroad',
        ]);

        // 2. Requesting again returns existing pending request idempotently
        $repeatResponse = $this->postJson('/api/v1/privacy/deletion', [
            'reason' => 'Duplicate attempt',
        ])->assertOk();
        $this->assertSame($response->json('data.id'), $repeatResponse->json('data.id'));

        // 3. Cancel deletion
        $cancelResponse = $this->deleteJson('/api/v1/privacy/deletion')
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');

        $this->assertDatabaseHas('account_deletion_requests', [
            'id' => $response->json('data.id'),
            'status' => 'cancelled',
        ]);
    }

    public function test_artisan_command_does_not_process_future_unexpired_deletions(): void
    {
        $this->seed();
        $user = User::factory()->create();

        $futureRequest = AccountDeletionRequest::query()->create([
            'user_id' => $user->id,
            'status' => 'pending',
            'reason' => 'Still within 30-day grace period',
            'requested_at' => now(),
            'scheduled_for' => now()->addDays(20),
        ]);

        $exitCode = Artisan::call('privacy:process-deletions');
        $this->assertSame(Command::SUCCESS, $exitCode);

        $futureRequest->refresh();
        $this->assertSame('pending', $futureRequest->status);
        $this->assertNull($futureRequest->completed_at);

        $user->refresh();
        $this->assertNull($user->deleted_at);
    }

    public function test_artisan_command_executes_due_deletion_with_full_anonymization(): void
    {
        $this->seed();
        Storage::fake('local');
        Storage::fake('public');

        $user = User::factory()->create([
            'name' => 'Ahmed Mahmoud',
            'email' => 'ahmed.mahmoud@domain.com',
            'normalized_email' => 'ahmed.mahmoud@domain.com',
            'avatar_path' => 'avatars/ahmed.jpg',
        ]);
        Storage::disk('public')->put('avatars/ahmed.jpg', 'avatar binary content');

        $deletionRequest = AccountDeletionRequest::query()->create([
            'user_id' => $user->id,
            'status' => 'pending',
            'reason' => 'Finished my academic studies',
            'requested_at' => now()->subDays(31),
            'scheduled_for' => now()->subMinute(),
        ]);

        // Create API token
        $user->createToken('Mobile App Access Token');

        // Create user session
        UserSession::query()->create([
            'user_id' => $user->id,
            'name' => 'Chrome on Windows',
            'refresh_token_hash' => hash('sha256', 'refresh_token_test_123'),
            'ip_address' => '192.168.1.50',
            'user_agent' => 'Mozilla/5.0 Test Browser',
            'last_used_at' => now(),
            'expires_at' => now()->addDays(7),
        ]);

        // Create database session in sessions table
        DB::table('sessions')->insert([
            'id' => 'session_1234567890',
            'user_id' => $user->id,
            'ip_address' => '192.168.1.50',
            'user_agent' => 'Mozilla/5.0 Test Browser',
            'payload' => base64_encode(serialize(['user' => $user->id])),
            'last_activity' => now()->getTimestamp(),
        ]);

        // Create password reset token
        DB::table('password_reset_tokens')->insert([
            'email' => $user->email,
            'token' => 'reset_token_secret_hash',
            'created_at' => now(),
        ]);

        $org = Organization::query()->first() ?? Organization::query()->create([
            'name' => 'Privacy Test Academy',
            'slug' => 'privacy-test-academy',
        ]);

        // Create device binding
        UserDevice::query()->create([
            'user_id' => $user->id,
            'organization_id' => $org->id,
            'device_hash' => hash('sha256', 'device-hardware-uuid'),
            'device_name' => 'Ahmed Samsung Galaxy S22',
            'status' => 'active',
            'first_seen_at' => now(),
            'last_seen_at' => now(),
        ]);

        // Create push token
        PushDeviceToken::query()->create([
            'user_id' => $user->id,
            'installation_id' => 'inst_12345',
            'provider' => 'fcm',
            'token' => 'fcm_mock_token_abc',
            'token_hash' => hash('sha256', 'fcm_mock_token_abc'),
            'platform' => 'android',
            'last_registered_at' => now(),
        ]);

        // Create notification preferences and notification
        NotificationPreference::query()->create([
            'user_id' => $user->id,
            'organization_id' => $org->id,
            'in_app_enabled' => true,
        ]);
        Notification::query()->create([
            'user_id' => $user->id,
            'organization_id' => $org->id,
            'type' => 'announcement',
            'title' => 'Welcome message',
            'body' => 'Welcome to the platform',
        ]);

        // Create content access log
        $course = Course::query()->first() ?? Course::factory()->create(['organization_id' => $org->id]);
        $contentItem = ContentItem::query()->first();
        if (! $contentItem) {
            $room = Room::query()->create([
                'organization_id' => $org->id,
                'created_by' => $user->id,
                'name' => 'Room A',
                'slug' => 'room-a-'.Str::random(5),
                'status' => 'active',
            ]);
            $contentItem = ContentItem::query()->create([
                'organization_id' => $org->id,
                'room_id' => $room->id,
                'created_by' => $user->id,
                'title' => 'Video A',
                'type' => 'youtube',
                'video_provider' => 'youtube',
                'external_video_id' => 'dQw4w9WgXcQ',
                'status' => 'published',
            ]);
        }

        DB::table('content_access_logs')->insert([
            'id' => (string) Str::uuid(),
            'organization_id' => $org->id,
            'content_item_id' => $contentItem->id,
            'user_id' => $user->id,
            'action' => 'play',
            'result' => 'allowed',
            'ip_address' => '41.128.0.10',
            'user_agent' => 'Mozilla/5.0 (Android; Mobile)',
            'created_at' => now(),
        ]);

        // Create support request
        $supportReq = SupportRequest::query()->create([
            'user_id' => $user->id,
            'name' => 'Ahmed Mahmoud',
            'email' => $user->email,
            'subject' => 'Billing inquiry',
            'message' => 'Please explain invoice breakdown for my card payment',
            'notes' => 'Agent notes: verified student on phone',
            'status' => 'closed',
        ]);

        // Create course booking in bookings table
        $batch = CourseBatch::query()->first();
        if (! $batch) {
            $batch = CourseBatch::query()->create([
                'organization_id' => $org->id,
                'course_id' => $course->id,
                'room_id' => $room->id,
                'title' => 'Batch A',
                'title_ar' => 'الدفعة الأولى',
                'schedule' => 'Sun, Tue 6 PM',
                'start_date' => now()->toDateString(),
                'end_date' => now()->addMonths(3)->toDateString(),
                'capacity' => 30,
                'delivery_type' => 'offline',
                'status' => 'open',
            ]);
        }

        $courseBooking = Booking::query()->create([
            'organization_id' => $org->id,
            'course_id' => $course->id,
            'batch_id' => $batch->id,
            'student_id' => $user->id,
            'student_name' => 'Ahmed Mahmoud',
            'email' => $user->email,
            'normalized_email' => $user->normalized_email,
            'phone' => '+201098765432',
            'note' => 'Please seat me in front row',
            'internal_note' => 'Parent phoned to confirm',
            'terms_accepted' => true,
            'status' => 'confirmed',
            'payment_status' => 'paid',
            'amount_minor' => 120000,
            'currency' => 'EGP',
        ]);

        // Create personal unreferenced file asset
        $diskPath = 'uploads/avatars/user_pic.jpg';
        Storage::disk('local')->put($diskPath, 'avatar image content');
        $fileAsset = FileAsset::query()->create([
            'organization_id' => $org->id,
            'uploaded_by' => $user->id,
            'disk' => 'local',
            'path' => $diskPath,
            'original_name' => 'user_pic.jpg',
            'mime_type' => 'image/jpeg',
            'size_bytes' => 1024,
            'status' => 'ready',
        ]);

        // Create payment record with PII in metadata (e.g. billing name, email, address)
        $payment = Payment::query()->create([
            'organization_id' => $org->id,
            'user_id' => $user->id,
            'provider' => 'paymob',
            'provider_reference' => 'paymob_txn_999888',
            'idempotency_key' => 'idemp_test_payment_456',
            'amount_minor' => 45000,
            'currency' => 'EGP',
            'status' => 'paid',
            'metadata' => [
                'customer_name' => 'Ahmed Mahmoud',
                'customer_email' => 'ahmed.mahmoud@domain.com',
                'customer_phone' => '+201012345678',
                'billing_address' => '15 Cairo St, Nasr City, Egypt',
                'custom_profile_note' => 'Student requested evening support calls',
                'invoice_no' => 'INV-2026-001',
            ],
            'paid_at' => now()->subMonths(3),
        ]);

        // Create instructor, slot and lesson booking with personal note and student phone
        $instructor = Instructor::query()->create([
            'organization_id' => $org->id,
            'name' => 'Tarek El-Sayed',
            'specialties' => ['Physics'],
            'status' => 'active',
        ]);
        $slot = InstructorAvailabilitySlot::query()->create([
            'organization_id' => $org->id,
            'instructor_id' => $instructor->id,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->subDay()->addHour(),
            'delivery_type' => 'online',
            'price_minor' => 25000,
            'currency' => 'EGP',
            'status' => 'booked',
        ]);
        $lessonBooking = LessonBooking::query()->create([
            'organization_id' => $org->id,
            'instructor_id' => $instructor->id,
            'slot_id' => $slot->id,
            'student_id' => $user->id,
            'subject' => 'Physics Mechanics',
            'status' => 'confirmed',
            'payment_status' => 'paid',
            'amount_minor' => 25000,
            'currency' => 'EGP',
            'student_phone' => '+201012345678',
            'student_note' => 'Please focus on calculus problems',
        ]);

        // ACT: Execute the command
        $exitCode = Artisan::call('privacy:process-deletions');
        $this->assertSame(Command::SUCCESS, $exitCode);

        // ASSERT:
        // 1. Verify Request Status
        $deletionRequest->refresh();
        $this->assertSame('completed', $deletionRequest->status);
        $this->assertNotNull($deletionRequest->completed_at);
        $this->assertNull($deletionRequest->reason);
        $this->assertNull($deletionRequest->failure_reason);

        // 2. Verify User is soft deleted and credentials/PII/avatar are anonymized
        $this->assertSoftDeleted('users', ['id' => $user->id]);
        $user->refresh();
        $this->assertStringStartsWith('Deleted User (', $user->name);
        $this->assertSame("deleted-{$user->id}@anonymized.local", $user->email);
        $this->assertSame("deleted-{$user->id}@anonymized.local", $user->normalized_email);
        $this->assertNull($user->avatar_path);
        Storage::disk('public')->assertMissing('avatars/ahmed.jpg');

        // 3. Verify access tokens, database sessions, password tokens, devices, push tokens are purged
        $this->assertDatabaseMissing('personal_access_tokens', ['tokenable_id' => $user->id]);
        $this->assertDatabaseMissing('user_sessions', ['user_id' => $user->id]);
        $this->assertDatabaseMissing('sessions', ['user_id' => $user->id]);
        $this->assertDatabaseMissing('password_reset_tokens', ['email' => 'ahmed.mahmoud@domain.com']);
        $this->assertDatabaseMissing('user_devices', ['user_id' => $user->id]);
        $this->assertDatabaseMissing('push_device_tokens', ['user_id' => $user->id]);
        $this->assertDatabaseMissing('notification_preferences', ['user_id' => $user->id]);
        $this->assertDatabaseMissing('notifications', ['user_id' => $user->id]);

        // 4. Verify unreferenced personal file asset and physical file are purged
        $this->assertDatabaseMissing('file_assets', ['id' => $fileAsset->id]);
        Storage::disk('local')->assertMissing($diskPath);

        // 5. Verify Content Access Logs IP and User-Agent are sanitized
        $this->assertDatabaseMissing('content_access_logs', [
            'user_id' => $user->id,
            'ip_address' => '41.128.0.10',
        ]);
        if ($course && $contentItem) {
            $this->assertDatabaseHas('content_access_logs', [
                'user_id' => $user->id,
                'ip_address' => null,
                'user_agent' => null,
            ]);
        }

        // 6. Verify Support Requests are sanitized
        $supportReq->refresh();
        $this->assertStringStartsWith('Anonymized User (', $supportReq->name);
        $this->assertSame("deleted-{$user->id}@anonymized.local", $supportReq->email);
        $this->assertStringContainsString('personal message redacted', $supportReq->message);
        $this->assertNull($supportReq->notes);

        // 7. Verify primary course Booking is anonymized
        $courseBooking->refresh();
        $this->assertStringStartsWith('Deleted Student (', $courseBooking->student_name);
        $this->assertSame("deleted-{$user->id}@anonymized.local", $courseBooking->email);
        $this->assertSame('+000000000000', $courseBooking->phone);
        $this->assertNull($courseBooking->note);
        $this->assertNull($courseBooking->internal_note);

        // 8. Verify Lesson Booking notes & phone sanitized
        $lessonBooking->refresh();
        $this->assertNull($lessonBooking->student_phone);
        $this->assertNull($lessonBooking->student_note);

        // 9. Verify payment ledger is retained for tax compliance, but customer PII stripped
        $payment->refresh();
        $this->assertNotNull($payment->id);
        $this->assertSame(45000, $payment->amount_minor);
        $this->assertArrayNotHasKey('customer_name', $payment->metadata);
        $this->assertArrayNotHasKey('customer_email', $payment->metadata);
        $this->assertArrayNotHasKey('customer_phone', $payment->metadata);
        $this->assertArrayNotHasKey('billing_address', $payment->metadata);
        $this->assertArrayNotHasKey('custom_profile_note', $payment->metadata);
        $this->assertSame('INV-2026-001', $payment->metadata['invoice_no']);
        $this->assertArrayHasKey('anonymized_at', $payment->metadata);

        // 10. Verify immutable audit log recorded
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'privacy.account.deleted',
            'entity_type' => 'user',
            'entity_id' => $user->id,
        ]);
    }

    public function test_artisan_command_fails_gracefully_when_storage_deletion_fails(): void
    {
        $this->seed();
        Storage::fake('s3_test');

        $user = User::factory()->create([
            'name' => 'Failing User',
            'email' => 'failing.user@domain.com',
        ]);

        $deletionRequest = AccountDeletionRequest::query()->create([
            'user_id' => $user->id,
            'status' => 'pending',
            'reason' => 'Test error handling',
            'requested_at' => now()->subDays(31),
            'scheduled_for' => now()->subMinute(),
        ]);

        $org = Organization::query()->first() ?? Organization::query()->create([
            'name' => 'Failing Org',
            'slug' => 'failing-org',
        ]);

        // Create file asset referencing non-existent disk to trigger Storage exception
        FileAsset::query()->create([
            'organization_id' => $org->id,
            'uploaded_by' => $user->id,
            'disk' => 'unconfigured_invalid_disk',
            'path' => 'files/important_file.pdf',
            'original_name' => 'important_file.pdf',
            'mime_type' => 'application/pdf',
            'size_bytes' => 2048,
            'status' => 'ready',
        ]);

        // ACT: Execute the command
        $exitCode = Artisan::call('privacy:process-deletions');

        // ASSERT: Command returns FAILURE exit code 1
        $this->assertSame(Command::FAILURE, $exitCode);

        // Request must NOT be completed; it must be marked failed with failure_reason
        $deletionRequest->refresh();
        $this->assertSame('failed', $deletionRequest->status);
        $this->assertNotNull($deletionRequest->failure_reason);
        $this->assertNull($deletionRequest->completed_at);

        // Transaction must be rolled back: user is NOT deleted or corrupted
        $user->refresh();
        $this->assertSame('Failing User', $user->name);
        $this->assertNull($user->deleted_at);
    }

    public function test_retention_purge_command_removes_expired_telemetry_and_stale_tokens(): void
    {
        $this->seed();
        $user = User::factory()->create();
        $org = Organization::query()->first() ?? Organization::query()->create([
            'name' => 'Purge Org',
            'slug' => 'purge-org',
        ]);

        $contentItem = ContentItem::query()->first();
        if (! $contentItem) {
            $room = Room::query()->create([
                'organization_id' => $org->id,
                'created_by' => $user->id,
                'name' => 'Purge Room',
                'slug' => 'purge-room-'.Str::random(5),
                'status' => 'active',
            ]);
            $contentItem = ContentItem::query()->create([
                'organization_id' => $org->id,
                'room_id' => $room->id,
                'created_by' => $user->id,
                'title' => 'Purge Video',
                'type' => 'youtube',
                'video_provider' => 'youtube',
                'external_video_id' => 'dQw4w9WgXcQ',
                'status' => 'published',
            ]);
        }

        // 1. Old content access log (>90 days old)
        $oldLogId = (string) Str::uuid();
        DB::table('content_access_logs')->insert([
            'id' => $oldLogId,
            'organization_id' => $org->id,
            'content_item_id' => $contentItem->id,
            'user_id' => $user->id,
            'action' => 'play',
            'result' => 'allowed',
            'ip_address' => '1.2.3.4',
            'created_at' => now()->subDays(100),
        ]);

        // 2. Recent content access log (10 days old)
        $recentLogId = (string) Str::uuid();
        DB::table('content_access_logs')->insert([
            'id' => $recentLogId,
            'organization_id' => $org->id,
            'content_item_id' => $contentItem->id,
            'user_id' => $user->id,
            'action' => 'play',
            'result' => 'allowed',
            'ip_address' => '5.6.7.8',
            'created_at' => now()->subDays(10),
        ]);

        // 3. Old verification code (>30 days old)
        VerificationCode::query()->create([
            'user_id' => $user->id,
            'email' => $user->email,
            'purpose' => 'email_verification',
            'code_hash' => hash('sha256', '123456'),
            'expires_at' => now()->subDays(40),
        ]);

        // 4. Old password reset token (>30 days old)
        DB::table('password_reset_tokens')->insert([
            'email' => 'old_reset@domain.com',
            'token' => 'old_token_hash',
            'created_at' => now()->subDays(45),
        ]);

        // 5. Recent password reset token (2 days old)
        DB::table('password_reset_tokens')->insert([
            'email' => 'recent_reset@domain.com',
            'token' => 'recent_token_hash',
            'created_at' => now()->subDays(2),
        ]);

        // ACT: Execute retention purge command
        $exitCode = Artisan::call('privacy:purge-expired-data');
        $this->assertSame(Command::SUCCESS, $exitCode);

        // ASSERT:
        $this->assertDatabaseMissing('content_access_logs', ['id' => $oldLogId]);
        $this->assertDatabaseHas('content_access_logs', ['id' => $recentLogId]);
        $this->assertDatabaseMissing('password_reset_tokens', ['email' => 'old_reset@domain.com']);
        $this->assertDatabaseHas('password_reset_tokens', ['email' => 'recent_reset@domain.com']);
    }
}
