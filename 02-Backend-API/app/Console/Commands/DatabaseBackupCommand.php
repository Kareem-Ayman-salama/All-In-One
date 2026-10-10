<?php

namespace App\Console\Commands;

use App\Services\Operations\BackupService;
use Illuminate\Console\Command;

class DatabaseBackupCommand extends Command
{
    protected $signature = 'backup:create
        {--label= : Custom label for the backup (e.g. pre_migration, scheduled)}
        {--disk= : Target storage disk (default: local or s3)}
        {--list : List existing backups from the manifest}';

    protected $description = 'Create a compressed, encrypted, and checksum-verified database backup';

    public function handle(BackupService $backupService): int
    {
        if ($this->option('list')) {
            $disk = $this->option('disk');
            $backups = $backupService->listBackups($disk);

            if (empty($backups)) {
                $this->info('No backups recorded in manifest.');

                return self::SUCCESS;
            }

            $rows = array_map(function ($b) {
                return [
                    $b['filename'] ?? 'unknown',
                    number_format(($b['size_bytes'] ?? 0) / 1024, 2).' KB',
                    substr($b['checksum'] ?? '', 0, 16).'...',
                    $b['table_count'] ?? 0,
                    $b['row_count'] ?? 0,
                    $b['created_at'] ?? 'N/A',
                ];
            }, $backups);

            $this->table(
                ['Filename', 'Size', 'SHA-256 Checksum', 'Tables', 'Rows', 'Created At'],
                $rows
            );

            return self::SUCCESS;
        }

        $this->info('Starting database backup generation...');
        $label = $this->option('label');
        $disk = $this->option('disk');

        $result = $backupService->createBackup($label, $disk);

        $this->newLine();
        $this->info('✓ Database Backup Created Successfully:');
        $this->table(
            ['Property', 'Value'],
            [
                ['Backup ID', $result['id']],
                ['Filename', $result['filename']],
                ['Storage Disk', $result['disk']],
                ['Path', $result['path']],
                ['Compressed Size', number_format($result['size_bytes'] / 1024, 2).' KB'],
                ['SHA-256 Checksum', $result['checksum']],
                ['Tables Backed Up', $result['table_count']],
                ['Records Backed Up', $result['row_count']],
                ['Duration', "{$result['duration_ms']} ms"],
                ['Created At', $result['created_at']],
            ]
        );

        return self::SUCCESS;
    }
}
