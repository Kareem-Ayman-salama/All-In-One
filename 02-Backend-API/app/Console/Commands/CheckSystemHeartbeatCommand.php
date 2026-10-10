<?php

namespace App\Console\Commands;

use App\Services\Observability\AlertNotificationService;
use App\Services\Security\Malware\MalwareScannerInterface;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Storage;
use Throwable;

class CheckSystemHeartbeatCommand extends Command
{
    protected $signature = 'health:check-services';

    protected $description = 'Periodic health check for critical infrastructure services with automated alert dispatch';

    public function handle(
        MalwareScannerInterface $scanner,
        AlertNotificationService $alertService,
    ): int {
        $hasErrors = false;

        // 1. ClamAV Heartbeat
        try {
            $isScannerUp = $scanner->isAvailable();
            if (! $isScannerUp) {
                $hasErrors = true;
                $alertService->notifyScannerOutage($scanner->name(), 'Daemon did not respond to PING socket check.');
                $this->error("ClamAV scanner [{$scanner->name()}] is DOWN.");
            } else {
                $this->info("ClamAV scanner [{$scanner->name()}] is UP.");
            }
        } catch (Throwable $e) {
            $hasErrors = true;
            $alertService->notifyScannerOutage($scanner->name(), $e->getMessage());
            $this->error("ClamAV exception: {$e->getMessage()}");
        }

        // 2. Redis Heartbeat
        try {
            $pong = Redis::connection()->ping();
            $this->info('Redis connection is UP.');
        } catch (Throwable $e) {
            $hasErrors = true;
            $this->error("Redis exception: {$e->getMessage()}");
        }

        // 3. Storage Heartbeat
        try {
            $disk = config('filesystems.default', 'local');
            $testFile = '_health/heartbeat.txt';
            Storage::disk($disk)->put($testFile, 'ok');
            Storage::disk($disk)->delete($testFile);
            $this->info("Storage disk [{$disk}] is UP.");
        } catch (Throwable $e) {
            $hasErrors = true;
            $alertService->notifyStorageThreshold(config('filesystems.default', 'local'), 100.0, "Storage read/write test failed: {$e->getMessage()}");
            $this->error("Storage exception: {$e->getMessage()}");
        }

        return $hasErrors ? self::FAILURE : self::SUCCESS;
    }
}
