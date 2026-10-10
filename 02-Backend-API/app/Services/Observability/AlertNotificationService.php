<?php

namespace App\Services\Observability;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class AlertNotificationService
{
    public function notifyQueueFailure(
        string $connection,
        string $queue,
        string $jobClass,
        Throwable $exception,
        ?string $jobId = null,
    ): void {
        $alertData = [
            'type' => 'queue_job_failure',
            'connection' => $connection,
            'queue' => $queue,
            'job' => $jobClass,
            'job_id' => $jobId,
            'error_message' => $exception->getMessage(),
            'error_class' => get_class($exception),
            'timestamp' => now()->toIso8601String(),
        ];

        Log::channel('single')->critical("[QUEUE_FAILURE_ALERT] Job {$jobClass} failed on queue {$queue}: {$exception->getMessage()}", $alertData);

        AuditLog::query()->create([
            'organization_id' => null,
            'actor_id' => null,
            'action' => 'alert.queue_failed',
            'entity_type' => 'queue_job',
            'entity_id' => $jobId,
            'metadata' => $alertData,
            'created_at' => now(),
        ]);

        $this->dispatchExternalAlert("🚨 [AIN Queue Alert] Job `{$jobClass}` failed on `{$queue}`: {$exception->getMessage()}", $alertData);
    }

    public function notifyScannerOutage(string $scannerName, string $error, int $consecutiveFailures = 1): void
    {
        $alertData = [
            'type' => 'malware_scanner_outage',
            'scanner' => $scannerName,
            'error' => $error,
            'consecutive_failures' => $consecutiveFailures,
            'policy' => 'fail-closed (uploads quarantined, downloads blocked)',
            'timestamp' => now()->toIso8601String(),
        ];

        Log::channel('single')->critical("[SCANNER_OUTAGE_ALERT] Malware scanner [{$scannerName}] is unreachable. Fail-closed policy enforced: {$error}", $alertData);

        AuditLog::query()->create([
            'organization_id' => null,
            'actor_id' => null,
            'action' => 'alert.scanner_outage',
            'entity_type' => 'malware_scanner',
            'entity_id' => $scannerName,
            'metadata' => $alertData,
            'created_at' => now(),
        ]);

        $this->dispatchExternalAlert("🛡️ [AIN Security Alert] Malware scanner `{$scannerName}` is DOWN! Fail-closed quarantine active. Error: {$error}", $alertData);
    }

    public function notifyStorageThreshold(string $disk, float $usedPercentage, string $details): void
    {
        $alertData = [
            'type' => 'storage_capacity_threshold',
            'disk' => $disk,
            'used_percentage' => round($usedPercentage, 2),
            'details' => $details,
            'timestamp' => now()->toIso8601String(),
        ];

        Log::channel('single')->warning("[STORAGE_THRESHOLD_ALERT] Storage disk [{$disk}] capacity warning: {$usedPercentage}% utilized", $alertData);

        AuditLog::query()->create([
            'organization_id' => null,
            'actor_id' => null,
            'action' => 'alert.storage_threshold',
            'entity_type' => 'storage_disk',
            'entity_id' => $disk,
            'metadata' => $alertData,
            'created_at' => now(),
        ]);

        $this->dispatchExternalAlert("⚠️ [AIN Storage Alert] Storage disk `{$disk}` has reached {$usedPercentage}% capacity.", $alertData);
    }

    protected function dispatchExternalAlert(string $textMessage, array $payload): void
    {
        $webhookUrl = env('ALERT_WEBHOOK_URL');
        if (! $webhookUrl) {
            return;
        }

        try {
            Http::timeout(3)->post($webhookUrl, [
                'text' => $textMessage,
                'json' => $payload,
            ]);
        } catch (Throwable $e) {
            Log::warning("Failed to dispatch external webhook alert: {$e->getMessage()}");
        }
    }
}
