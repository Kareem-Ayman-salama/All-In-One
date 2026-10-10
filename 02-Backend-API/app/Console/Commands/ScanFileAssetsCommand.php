<?php

namespace App\Console\Commands;

use App\Models\FileAsset;
use App\Services\Security\Malware\FileAssetSecurityService;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Builder;

class ScanFileAssetsCommand extends Command
{
    protected $signature = 'security:scan-assets
        {--asset= : Target specific FileAsset UUID}
        {--status= : Filter assets by status (e.g. pending, scanning, failed, infected, ready)}
        {--limit=50 : Limit number of assets to process}
        {--force : Force re-scanning even if already ready}';

    protected $description = 'Scan uploaded file assets for malware and update quarantine status';

    public function handle(FileAssetSecurityService $securityService): int
    {
        $this->info('Starting file asset security scan...');

        $query = FileAsset::query();

        if ($assetId = $this->option('asset')) {
            $query->where('id', $assetId);
        } else {
            $status = $this->option('status');
            $force = (bool) $this->option('force');

            if ($status) {
                if (! in_array($status, [
                    FileAsset::STATUS_PENDING,
                    FileAsset::STATUS_SCANNING,
                    FileAsset::STATUS_FAILED,
                    FileAsset::STATUS_INFECTED,
                    FileAsset::STATUS_READY,
                ], true)) {
                    $this->error("Unsupported file asset status [{$status}].");

                    return self::INVALID;
                }

                $query->where('status', $status);
            } elseif ($force) {
                $query->whereIn('status', [
                    FileAsset::STATUS_PENDING,
                    FileAsset::STATUS_SCANNING,
                    FileAsset::STATUS_FAILED,
                    FileAsset::STATUS_READY,
                ]);
            } else {
                $staleBefore = now()->subMinutes(max(
                    (int) config('malware_scanner.retry.stale_scan_minutes', 10),
                    1,
                ));
                $maxAttempts = max(
                    (int) config('malware_scanner.retry.max_attempts', 5),
                    1,
                );
                $query->where(function (Builder $builder) use (
                    $maxAttempts,
                    $staleBefore,
                ): void {
                    $builder
                        ->where('status', FileAsset::STATUS_PENDING)
                        ->orWhere(function (Builder $stale) use ($staleBefore): void {
                            $stale
                                ->where('status', FileAsset::STATUS_SCANNING)
                                ->where('updated_at', '<=', $staleBefore);
                        })
                        ->orWhere(function (Builder $failed) use ($maxAttempts): void {
                            $failed
                                ->where('status', FileAsset::STATUS_FAILED)
                                ->where('scan_attempts', '<', $maxAttempts)
                                ->where(function (Builder $retryable): void {
                                    $retryable
                                        ->whereNull('next_scan_at')
                                        ->orWhere('next_scan_at', '<=', now());
                                });
                        });
                });
            }

            $limit = min(max((int) $this->option('limit'), 1), 500);
            $query->limit($limit);
        }

        $assets = $query->get();

        if ($assets->isEmpty()) {
            $this->info('No matching file assets found for scanning.');

            return self::SUCCESS;
        }

        $this->line("Found {$assets->count()} asset(s) to scan.");

        $tableRows = [];
        $cleanCount = 0;
        $infectedCount = 0;
        $failedCount = 0;

        foreach ($assets as $asset) {
            $result = $securityService->scanAsset($asset);

            if ($result->isClean()) {
                $cleanCount++;
                $statusDisplay = '<info>CLEAN</info>';
            } elseif ($result->isInfected()) {
                $infectedCount++;
                $statusDisplay = '<error>INFECTED</error>';
            } else {
                $failedCount++;
                $statusDisplay = '<comment>FAILED</comment>';
            }

            $tableRows[] = [
                $asset->id,
                $asset->original_name,
                number_format($asset->size_bytes).' bytes',
                $result->scannerName,
                $statusDisplay,
                $result->threatName ?? '-',
                round($result->durationMs, 1).' ms',
            ];
        }

        $this->table(
            ['ID', 'File Name', 'Size', 'Scanner', 'Status', 'Threat', 'Duration'],
            $tableRows
        );

        $this->info("Completed scan: {$cleanCount} clean, {$infectedCount} infected, {$failedCount} failed.");

        return $infectedCount > 0 ? self::FAILURE : self::SUCCESS;
    }
}
