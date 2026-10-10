<?php

namespace App\Console\Commands;

use App\Services\Security\Malware\ClamAvScanner;
use App\Services\Security\Malware\HeuristicScanner;
use App\Services\Security\Malware\MalwareScannerInterface;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Storage;
use Throwable;

class VerifyStagingInfrastructureCommand extends Command
{
    protected $signature = 'staging:verify-infrastructure
        {--eicar : Stream standard EICAR test signature to verify live malware detection}
        {--fail-closed-test : Simulate scanner outage and verify fail-closed quarantine behavior}';

    protected $description = 'Verify connectivity and health of Staging infrastructure (PostgreSQL, Redis, S3/R2 Storage, SMTP, ClamAV)';

    public function handle(MalwareScannerInterface $scanner): int
    {
        $this->newLine();
        $this->info('================================================================');
        $this->info('       AIN Platform — Staging Infrastructure Verification       ');
        $this->info('================================================================');
        $this->newLine();

        $rows = [];
        $hasFailures = false;

        // 1. PostgreSQL Check
        $rows[] = $this->checkDatabase($hasFailures);

        // 2. Redis Check
        $rows[] = $this->checkRedis($hasFailures);

        // 3. Storage (S3 / MinIO / Private Storage)
        $rows[] = $this->checkStorage($hasFailures);

        // 4. SMTP / Mailpit Check
        $rows[] = $this->checkSmtp($hasFailures);

        // 5. ClamAV Daemon Check
        $rows[] = $this->checkClamAv($scanner, $hasFailures);

        // Render Summary Table
        $this->table(
            ['Infrastructure Component', 'Target / Endpoint', 'Status', 'Latency', 'Details'],
            $rows,
        );

        // 6. Optional EICAR Live Test
        if ($this->option('eicar')) {
            $this->newLine();
            $this->info('--- Running Live EICAR Antivirus Detection Test ---');
            $eicarPassed = $this->runEicarTest($scanner);
            if (! $eicarPassed) {
                $hasFailures = true;
            }
        }

        // 7. Optional Fail-Closed Simulation Test
        if ($this->option('fail-closed-test')) {
            $this->newLine();
            $this->info('--- Running Scanner Outage & Fail-Closed Simulation ---');
            $failClosedPassed = $this->runFailClosedSimulation();
            if (! $failClosedPassed) {
                $hasFailures = true;
            }
        }

        $this->newLine();
        if ($hasFailures) {
            $this->error('Staging Infrastructure Verification FAILED: One or more components require attention.');

            return self::FAILURE;
        }

        $this->info('ALL STAGING INFRASTRUCTURE COMPONENTS ARE HEALTHY AND OPERATIONAL.');

        return self::SUCCESS;
    }

    protected function checkDatabase(bool &$hasFailures): array
    {
        $start = hrtime(true);
        $connection = config('database.default', 'pgsql');
        $host = config("database.connections.{$connection}.host", 'localhost');
        $database = config("database.connections.{$connection}.database", 'ain_staging');

        try {
            $pdo = DB::connection()->getPdo();
            $driver = DB::connection()->getDriverName();

            if ($driver === 'pgsql') {
                $versionRow = DB::selectOne('SELECT version() as v');
                $version = Str($versionRow->v ?? '')->before(',')->toString();
            } else {
                $version = $driver;
            }

            $tableCount = count(DB::connection()->getDoctrineSchemaManager()->listTableNames());
            $latency = (int) round((hrtime(true) - $start) / 1e6);

            return [
                'Database (PostgreSQL)',
                "{$host} / {$database}",
                '<fg=green;options=bold>PASS</>',
                "{$latency}ms",
                "Connected ({$version}), {$tableCount} tables present",
            ];
        } catch (Throwable $e) {
            $hasFailures = true;
            $latency = (int) round((hrtime(true) - $start) / 1e6);

            return [
                'Database (PostgreSQL)',
                "{$host} / {$database}",
                '<fg=red;options=bold>FAIL</>',
                "{$latency}ms",
                'Error: '.Str($e->getMessage())->limit(60),
            ];
        }
    }

    protected function checkRedis(bool &$hasFailures): array
    {
        $start = hrtime(true);
        $host = config('database.redis.default.host', '127.0.0.1');
        $port = config('database.redis.default.port', 6379);

        try {
            $client = Redis::connection();
            $ping = $client->ping();
            $key = 'staging_health_probe_'.time();
            $client->setex($key, 30, 'probe_value');
            $read = $client->get($key);
            $client->del($key);

            $latency = (int) round((hrtime(true) - $start) / 1e6);

            if ($read !== 'probe_value') {
                throw new \RuntimeException('Redis write-read value mismatch.');
            }

            return [
                'Cache & Queue (Redis)',
                "{$host}:{$port}",
                '<fg=green;options=bold>PASS</>',
                "{$latency}ms",
                'PING/PONG verified, read/write roundtrip OK',
            ];
        } catch (Throwable $e) {
            $hasFailures = true;
            $latency = (int) round((hrtime(true) - $start) / 1e6);

            return [
                'Cache & Queue (Redis)',
                "{$host}:{$port}",
                '<fg=red;options=bold>FAIL</>',
                "{$latency}ms",
                'Error: '.Str($e->getMessage())->limit(60),
            ];
        }
    }

    protected function checkStorage(bool &$hasFailures): array
    {
        $start = hrtime(true);
        $diskName = config('filesystems.default', 's3');
        $bucket = config('filesystems.disks.s3.bucket', 'ain-content-staging-private');

        try {
            $disk = Storage::disk($diskName);
            $path = '_healthcheck/probe_'.time().'.txt';
            $disk->put($path, 'probe_content_'.time());
            $exists = $disk->exists($path);
            $content = $disk->get($path);
            $disk->delete($path);

            $latency = (int) round((hrtime(true) - $start) / 1e6);

            if (! $exists || ! str_starts_with($content, 'probe_content_')) {
                throw new \RuntimeException('Storage read back verification failed.');
            }

            return [
                'Object Storage (S3/R2)',
                "disk: {$diskName} ({$bucket})",
                '<fg=green;options=bold>PASS</>',
                "{$latency}ms",
                'Bucket accessible, PUT/GET/DELETE successful',
            ];
        } catch (Throwable $e) {
            $hasFailures = true;
            $latency = (int) round((hrtime(true) - $start) / 1e6);

            return [
                'Object Storage (S3/R2)',
                "disk: {$diskName} ({$bucket})",
                '<fg=red;options=bold>FAIL</>',
                "{$latency}ms",
                'Error: '.Str($e->getMessage())->limit(60),
            ];
        }
    }

    protected function checkSmtp(bool &$hasFailures): array
    {
        $start = hrtime(true);
        $host = config('mail.mailers.smtp.host', '127.0.0.1');
        $port = (int) config('mail.mailers.smtp.port', 1025);
        $timeout = 5;

        $errno = 0;
        $errstr = '';
        $socket = @stream_socket_client("tcp://{$host}:{$port}", $errno, $errstr, $timeout);

        if (! is_resource($socket)) {
            $hasFailures = true;
            $latency = (int) round((hrtime(true) - $start) / 1e6);

            return [
                'Mail Server (SMTP / Mailpit)',
                "{$host}:{$port}",
                '<fg=red;options=bold>FAIL</>',
                "{$latency}ms",
                "Connection failed: [{$errno}] {$errstr}",
            ];
        }

        try {
            stream_set_timeout($socket, $timeout);
            $greeting = fgets($socket, 512);
            fwrite($socket, "EHLO staging.ainplatform.com\r\n");
            $response = fgets($socket, 512);
            fwrite($socket, "QUIT\r\n");
            fclose($socket);

            $latency = (int) round((hrtime(true) - $start) / 1e6);
            $banner = trim(str_replace("\r\n", ' ', $greeting ?: ''));

            return [
                'Mail Server (SMTP / Mailpit)',
                "{$host}:{$port}",
                '<fg=green;options=bold>PASS</>',
                "{$latency}ms",
                'Connected: '.Str($banner)->limit(45),
            ];
        } catch (Throwable $e) {
            $hasFailures = true;
            $latency = (int) round((hrtime(true) - $start) / 1e6);
            if (is_resource($socket)) {
                fclose($socket);
            }

            return [
                'Mail Server (SMTP / Mailpit)',
                "{$host}:{$port}",
                '<fg=red;options=bold>FAIL</>',
                "{$latency}ms",
                'Error: '.Str($e->getMessage())->limit(60),
            ];
        }
    }

    protected function checkClamAv(MalwareScannerInterface $scanner, bool &$hasFailures): array
    {
        $start = hrtime(true);
        $driver = config('malware_scanner.driver', 'clamav');
        $host = config('malware_scanner.clamav.host', '127.0.0.1');
        $port = config('malware_scanner.clamav.port', 3310);

        try {
            $available = $scanner->isAvailable();
            $latency = (int) round((hrtime(true) - $start) / 1e6);

            if (! $available) {
                $hasFailures = true;

                return [
                    'Malware Scanner (ClamAV)',
                    "driver: {$driver} ({$host}:{$port})",
                    '<fg=red;options=bold>FAIL</>',
                    "{$latency}ms",
                    'Scanner daemon not responding to PING. Fail-closed is active.',
                ];
            }

            return [
                'Malware Scanner (ClamAV)',
                "driver: {$driver} ({$host}:{$port})",
                '<fg=green;options=bold>PASS</>',
                "{$latency}ms",
                'Daemon active (PONG response received)',
            ];
        } catch (Throwable $e) {
            $hasFailures = true;
            $latency = (int) round((hrtime(true) - $start) / 1e6);

            return [
                'Malware Scanner (ClamAV)',
                "driver: {$driver} ({$host}:{$port})",
                '<fg=red;options=bold>FAIL</>',
                "{$latency}ms",
                'Error: '.Str($e->getMessage())->limit(60),
            ];
        }
    }

    protected function runEicarTest(MalwareScannerInterface $scanner): bool
    {
        $eicarString = HeuristicScanner::EICAR_SIGNATURE;
        $tempPath = tempnam(sys_get_temp_dir(), 'eicar_probe_');
        file_put_contents($tempPath, $eicarString);

        try {
            $result = $scanner->scanFile($tempPath);
            if ($result->isInfected()) {
                $this->info("✓ EICAR Test PASSED: Malware detected with threat: [{$result->threatName}] in {$result->durationMs}ms.");

                return true;
            }

            $this->error("✗ EICAR Test FAILED: Scanner returned clean or failed for EICAR string. Result: {$result->status}");

            return false;
        } finally {
            if (file_exists($tempPath)) {
                unlink($tempPath);
            }
        }
    }

    protected function runFailClosedSimulation(): bool
    {
        // Point scanner to an invalid / closed port to simulate unexpected daemon crash
        $brokenScanner = new ClamAvScanner([
            'transport' => 'tcp',
            'host' => '127.0.0.1',
            'port' => 64999, // Unused port
            'timeout' => 1,
        ]);

        $tempPath = tempnam(sys_get_temp_dir(), 'fail_closed_probe_');
        file_put_contents($tempPath, 'Benign course syllabus PDF content');

        try {
            $result = $brokenScanner->scanFile($tempPath);
            if ($result->isFailed()) {
                $this->info('✓ Fail-Closed Simulation PASSED: Broken daemon was caught gracefully. Scan result status: [failed].');
                $this->info('  Quarantine system blocks file distribution until scanner recovers.');

                return true;
            }

            $this->error('✗ Fail-Closed Simulation FAILED: Broken scanner did not report failure status.');

            return false;
        } finally {
            if (file_exists($tempPath)) {
                unlink($tempPath);
            }
        }
    }
}
