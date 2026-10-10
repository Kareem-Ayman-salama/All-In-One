<?php

namespace Tests\Feature;

use App\Logging\SanitizedJsonFormatter;
use App\Models\User;
use App\Services\Observability\AlertNotificationService;
use App\Services\Observability\ErrorTrackingService;
use App\Services\Operations\BackupService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Monolog\Level;
use Monolog\LogRecord;
use RuntimeException;
use Tests\TestCase;

class BackupAndObservabilityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
    }

    public function test_database_backup_creates_compressed_archive_with_sha256_checksum(): void
    {
        $this->seed();
        User::factory()->create(['name' => 'Backup Test User', 'email' => 'backup_test@ain.test']);

        $service = app(BackupService::class);
        $backup = $service->createBackup(label: 'unit_test', disk: 'local');

        $this->assertNotEmpty($backup['id']);
        $this->assertNotEmpty($backup['filename']);
        $this->assertStringEndsWith('.sql.gz', $backup['filename']);
        $this->assertGreaterThan(0, $backup['size_bytes']);
        $this->assertNotEmpty($backup['checksum']);
        $this->assertGreaterThan(0, $backup['table_count']);

        // Assert file exists on storage
        $this->assertTrue(Storage::disk('local')->exists($backup['path']));

        // Verify SHA-256 Checksum against actual stored file bytes
        $storedContent = Storage::disk('local')->get($backup['path']);
        $actualChecksum = hash('sha256', $storedContent);
        $this->assertEquals($backup['checksum'], $actualChecksum);

        // Verify Manifest updated
        $manifest = $service->listBackups('local');
        $this->assertNotEmpty($manifest);
        $this->assertEquals($backup['id'], $manifest[0]['id']);

        // Verify Audit Log entry
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'backup.created',
            'entity_id' => $backup['id'],
        ]);
    }

    public function test_backup_rehearsal_validates_decompression_and_table_parity(): void
    {
        $this->seed();
        $service = app(BackupService::class);

        $rehearsal = $service->runRehearsal('local');

        $this->assertEquals('PASSED', $rehearsal['status']);
        $this->assertTrue($rehearsal['parity_verified']);
        $this->assertTrue($rehearsal['integrity_verified']);
        $this->assertGreaterThan(0, $rehearsal['tables_in_backup']);
        $this->assertEquals($rehearsal['tables_in_database'], $rehearsal['tables_in_backup']);
        $this->assertGreaterThan(0, $rehearsal['statements_parsed']);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'backup.rehearsal_completed',
            'entity_id' => $rehearsal['rehearsal_id'],
        ]);
    }

    public function test_error_tracking_service_redacts_sensitive_credentials_and_tokens(): void
    {
        $tracker = app(ErrorTrackingService::class);

        $sensitivePayload = [
            'user' => [
                'name' => 'Kareem Ahmed',
                'password' => 'super_secret_password_123',
                'password_confirmation' => 'super_secret_password_123',
            ],
            'auth' => [
                'access_token' => 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_token',
                'client_secret' => 'test-client-secret-for-redaction',
                'otp_code' => '948271',
            ],
            'payment' => [
                'credit_card' => '4111-2222-3333-4444',
                'cvv' => '992',
            ],
            'headers' => [
                'Authorization' => 'Bearer eyJhbGciOiJIUzI1Ni.some_bearer_payload',
            ],
            'benign_metric' => 'lesson_id_9921',
        ];

        $sanitized = $tracker->sanitize($sensitivePayload);

        // Assert sensitive keys are redacted
        $this->assertEquals('[REDACTED]', $sanitized['user']['password']);
        $this->assertEquals('[REDACTED]', $sanitized['user']['password_confirmation']);
        $this->assertEquals('[REDACTED]', $sanitized['auth']['access_token']);
        $this->assertEquals('[REDACTED]', $sanitized['auth']['client_secret']);
        $this->assertEquals('[REDACTED]', $sanitized['auth']['otp_code']);
        $this->assertEquals('[REDACTED]', $sanitized['payment']['credit_card']);
        $this->assertEquals('[REDACTED]', $sanitized['payment']['cvv']);
        $this->assertEquals('[REDACTED]', $sanitized['headers']['Authorization']);

        // Assert non-sensitive keys remain intact
        $this->assertEquals('Kareem Ahmed', $sanitized['user']['name']);
        $this->assertEquals('lesson_id_9921', $sanitized['benign_metric']);
    }

    public function test_queue_failure_triggers_alert_notification_and_audit_log(): void
    {
        $alertService = app(AlertNotificationService::class);
        $exception = new RuntimeException('Connection timeout to SMTP gateway');

        $alertService->notifyQueueFailure(
            connection: 'redis',
            queue: 'notifications',
            jobClass: 'App\Jobs\SendGuardianOtpJob',
            exception: $exception,
            jobId: 'job_uuid_992',
        );

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'alert.queue_failed',
            'entity_type' => 'queue_job',
            'entity_id' => 'job_uuid_992',
        ]);
    }

    public function test_scanner_outage_triggers_critical_alert(): void
    {
        $alertService = app(AlertNotificationService::class);

        $alertService->notifyScannerOutage(
            scannerName: 'clamav',
            error: 'Socket tcp://clamav:3310 unreachable',
            consecutiveFailures: 3,
        );

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'alert.scanner_outage',
            'entity_type' => 'malware_scanner',
            'entity_id' => 'clamav',
        ]);
    }

    public function test_sanitized_json_log_formatter_scrubs_secrets(): void
    {
        $formatter = new SanitizedJsonFormatter;

        $record = new LogRecord(
            datetime: new \DateTimeImmutable('2026-09-30 10:00:00'),
            channel: 'staging',
            level: Level::Error,
            message: 'User login failed with header Authorization: Bearer secret_token_xyz',
            context: [
                'password' => 'plaintext_password',
                'card_number' => '4111-2222-3333-4444',
                'user_id' => 'user_123',
            ],
            extra: [
                'token' => 'super_secret_cookie_token',
            ],
        );

        $formattedJson = $formatter->format($record);
        $decoded = json_decode($formattedJson, true);

        $this->assertIsArray($decoded);
        $this->assertEquals('ERROR', $decoded['level']);
        $this->assertStringNotContainsString('secret_token_xyz', $decoded['message']);
        $this->assertStringContainsString('Bearer [REDACTED]', $decoded['message']);
        $this->assertEquals('[REDACTED]', $decoded['context']['password']);
        $this->assertEquals('[REDACTED]', $decoded['context']['card_number']);
        $this->assertEquals('[REDACTED]', $decoded['extra']['token']);
        $this->assertEquals('user_123', $decoded['context']['user_id']);
    }
}
