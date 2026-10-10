<?php

namespace App\Console\Commands;

use App\Services\Operations\BackupService;
use Illuminate\Console\Command;
use Throwable;

class BackupRehearsalCommand extends Command
{
    protected $signature = 'backup:rehearsal
        {--disk= : Storage disk to use for rehearsal}';

    protected $description = 'Execute automated backup-and-restore rehearsal drill with checksum and schema parity checks';

    public function handle(BackupService $backupService): int
    {
        $this->newLine();
        $this->info('================================================================');
        $this->info('       AIN Platform — Automated Backup & Restore Rehearsal       ');
        $this->info('================================================================');
        $this->newLine();

        $disk = $this->option('disk');

        try {
            $report = $backupService->runRehearsal($disk);

            $this->table(
                ['Verification Step', 'Result', 'Details'],
                [
                    ['Backup Generation', '<fg=green;options=bold>PASS</>', "Archive: {$report['filename']} (".number_format($report['size_bytes'] / 1024, 2).' KB)'],
                    ['Cryptographic Hash', '<fg=green;options=bold>PASS</>', "SHA-256: {$report['checksum']}"],
                    ['Decompression & Parsing', '<fg=green;options=bold>PASS</>', "{$report['statements_parsed']} SQL statements parsed cleanly"],
                    ['Schema Parity Check', $report['parity_verified'] ? '<fg=green;options=bold>PASS</>' : '<fg=red;options=bold>FAIL</>', "Backup tables: {$report['tables_in_backup']} | DB tables: {$report['tables_in_database']}"],
                    ['Integrity Status', $report['integrity_verified'] ? '<fg=green;options=bold>PASS</>' : '<fg=red;options=bold>FAIL</>', 'Checksum verified against storage'],
                    ['Rehearsal Duration', 'COMPLETE', "{$report['total_duration_ms']} ms"],
                ]
            );

            if ($report['status'] !== 'PASSED') {
                $this->error('REHEARSAL FAILED: Data parity or integrity mismatch detected.');

                return self::FAILURE;
            }

            $this->newLine();
            $this->info("✓ BACKUP REHEARSAL PASSED. Audit record stored [ID: {$report['rehearsal_id']}].");

            return self::SUCCESS;
        } catch (Throwable $e) {
            $this->newLine();
            $this->error("REHEARSAL CRITICAL EXCEPTION: {$e->getMessage()}");

            return self::FAILURE;
        }
    }
}
