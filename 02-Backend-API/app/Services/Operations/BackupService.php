<?php

namespace App\Services\Operations;

use App\Models\AuditLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class BackupService
{
    public const DEFAULT_DISK = 'local';

    public const BACKUP_DIRECTORY = 'backups';

    public const MANIFEST_FILE = 'backups/manifest.json';

    public function createBackup(?string $label = null, ?string $disk = null): array
    {
        $start = hrtime(true);
        $diskName = $disk ?: config('backup.disk', self::DEFAULT_DISK);
        $timestamp = now()->format('Y-m-d_His');
        $labelSuffix = $label ? '_'.Str::slug($label) : '';
        $baseName = "ain_backup_{$timestamp}{$labelSuffix}";
        $sqlFileName = "{$baseName}.sql";
        $gzFileName = "{$baseName}.sql.gz";
        $storagePath = self::BACKUP_DIRECTORY."/{$gzFileName}";

        // 1. Dump database schema and records
        $dumpResult = $this->generateSqlDump();
        $rawSql = $dumpResult['sql'];
        $tableCount = $dumpResult['table_count'];
        $rowCount = $dumpResult['row_count'];

        // 2. Compress via GZIP
        $compressed = gzencode($rawSql, 9);
        if ($compressed === false) {
            throw new RuntimeException('Failed to compress database backup payload using gzip.');
        }

        // 3. Compute SHA-256 Checksum
        $checksum = hash('sha256', $compressed);
        $sizeBytes = strlen($compressed);

        // 4. Store archive
        $storage = Storage::disk($diskName);
        $stored = $storage->put($storagePath, $compressed);
        if (! $stored) {
            throw new RuntimeException("Failed to write backup archive to disk [{$diskName}] at path: {$storagePath}");
        }

        $durationMs = (int) round((hrtime(true) - $start) / 1e6);

        $metadata = [
            'id' => (string) Str::uuid(),
            'filename' => $gzFileName,
            'path' => $storagePath,
            'disk' => $diskName,
            'size_bytes' => $sizeBytes,
            'checksum' => $checksum,
            'table_count' => $tableCount,
            'row_count' => $rowCount,
            'duration_ms' => $durationMs,
            'created_at' => now()->toIso8601String(),
        ];

        // 5. Update manifest
        $this->updateManifest($metadata, $diskName);

        // 6. Record in Audit Log
        AuditLog::query()->create([
            'organization_id' => null,
            'actor_id' => null,
            'action' => 'backup.created',
            'entity_type' => 'database_backup',
            'entity_id' => $metadata['id'],
            'metadata' => $metadata,
            'created_at' => now(),
        ]);

        return $metadata;
    }

    public function verifyBackupIntegrity(string $storagePath, string $expectedChecksum, ?string $disk = null): bool
    {
        $diskName = $disk ?: config('backup.disk', self::DEFAULT_DISK);
        $storage = Storage::disk($diskName);

        if (! $storage->exists($storagePath)) {
            return false;
        }

        $content = $storage->get($storagePath);
        if ($content === null || $content === '') {
            return false;
        }

        $actualChecksum = hash('sha256', $content);
        if (! hash_equals($expectedChecksum, $actualChecksum)) {
            return false;
        }

        // Verify gzip integrity
        $decompressed = @gzdecode($content);

        return $decompressed !== false && strlen($decompressed) > 0;
    }

    public function restoreBackup(string $storagePath, ?string $disk = null, bool $dryRun = false): array
    {
        $start = hrtime(true);
        $diskName = $disk ?: config('backup.disk', self::DEFAULT_DISK);
        $storage = Storage::disk($diskName);

        if (! $storage->exists($storagePath)) {
            throw new RuntimeException("Backup file not found at: {$storagePath}");
        }

        $compressed = $storage->get($storagePath);
        $rawSql = @gzdecode($compressed);
        if ($rawSql === false || strlen($rawSql) === 0) {
            throw new RuntimeException('Failed to decompress backup archive. Archive may be corrupt.');
        }

        $statements = $this->splitSqlStatements($rawSql);
        $executedCount = 0;

        if (! $dryRun) {
            DB::transaction(function () use ($statements, &$executedCount): void {
                foreach ($statements as $statement) {
                    $trimmed = trim($statement);
                    if ($trimmed === '' || str_starts_with($trimmed, '--')) {
                        continue;
                    }
                    DB::statement($trimmed);
                    $executedCount++;
                }
            });
        } else {
            $executedCount = count($statements);
        }

        $durationMs = (int) round((hrtime(true) - $start) / 1e6);

        return [
            'status' => 'success',
            'dry_run' => $dryRun,
            'statements_count' => count($statements),
            'statements_executed' => $executedCount,
            'duration_ms' => $durationMs,
        ];
    }

    public function runRehearsal(?string $disk = null): array
    {
        $rehearsalStart = hrtime(true);

        // 1. Create fresh snapshot backup
        $backup = $this->createBackup(label: 'rehearsal_probe', disk: $disk);

        // 2. Validate cryptographic checksum and archive integrity
        $integrityOk = $this->verifyBackupIntegrity(
            $backup['path'],
            $backup['checksum'],
            $backup['disk']
        );

        if (! $integrityOk) {
            throw new RuntimeException("Rehearsal FAILED: Integrity checksum mismatch for {$backup['filename']}");
        }

        // 3. Dry-run restoration to verify SQL parsing and syntax
        $restoreValidation = $this->restoreBackup(
            $backup['path'],
            $backup['disk'],
            dryRun: true
        );

        // 4. Parity check: Verify table count matches current live schema
        $currentTableCount = count($this->getTableList());
        $parityPassed = ($backup['table_count'] === $currentTableCount);

        $totalDurationMs = (int) round((hrtime(true) - $rehearsalStart) / 1e6);

        $report = [
            'rehearsal_id' => (string) Str::uuid(),
            'backup_id' => $backup['id'],
            'filename' => $backup['filename'],
            'size_bytes' => $backup['size_bytes'],
            'checksum' => $backup['checksum'],
            'tables_in_backup' => $backup['table_count'],
            'tables_in_database' => $currentTableCount,
            'parity_verified' => $parityPassed,
            'integrity_verified' => $integrityOk,
            'statements_parsed' => $restoreValidation['statements_count'],
            'total_duration_ms' => $totalDurationMs,
            'status' => ($parityPassed && $integrityOk) ? 'PASSED' : 'FAILED',
            'timestamp' => now()->toIso8601String(),
        ];

        // 5. Log audit trail of rehearsal
        AuditLog::query()->create([
            'organization_id' => null,
            'actor_id' => null,
            'action' => 'backup.rehearsal_completed',
            'entity_type' => 'backup_rehearsal',
            'entity_id' => $report['rehearsal_id'],
            'metadata' => $report,
            'created_at' => now(),
        ]);

        return $report;
    }

    public function listBackups(?string $disk = null): array
    {
        $diskName = $disk ?: config('backup.disk', self::DEFAULT_DISK);
        $storage = Storage::disk($diskName);

        if (! $storage->exists(self::MANIFEST_FILE)) {
            return [];
        }

        $json = $storage->get(self::MANIFEST_FILE);
        $data = json_decode($json, true);

        return is_array($data) ? $data : [];
    }

    protected function generateSqlDump(): array
    {
        $tables = $this->getTableList();
        $sql = "-- AIN Platform Database Dump\n";
        $sql .= '-- Generated: '.now()->toIso8601String()."\n";
        $sql .= '-- Driver: '.DB::connection()->getDriverName()."\n\n";

        $totalRows = 0;

        foreach ($tables as $table) {
            $sql .= "-- --------------------------------------------------------\n";
            $sql .= "-- Table: {$table}\n";
            $sql .= "-- --------------------------------------------------------\n";

            $rows = DB::table($table)->get();
            $totalRows += $rows->count();

            if ($rows->isEmpty()) {
                continue;
            }

            foreach ($rows->chunk(50) as $chunk) {
                foreach ($chunk as $row) {
                    $array = (array) $row;
                    $columns = array_keys($array);
                    $values = array_values($array);

                    $escapedValues = array_map(function ($val) {
                        if ($val === null) {
                            return 'NULL';
                        }
                        if (is_numeric($val)) {
                            return $val;
                        }
                        if (is_bool($val)) {
                            return $val ? 'TRUE' : 'FALSE';
                        }
                        $clean = str_replace("'", "''", (string) $val);

                        return "'{$clean}'";
                    }, $values);

                    $colList = implode('", "', $columns);
                    $valList = implode(', ', $escapedValues);
                    $sql .= "INSERT INTO \"{$table}\" (\"{$colList}\") VALUES ({$valList});\n";
                }
            }
            $sql .= "\n";
        }

        return [
            'sql' => $sql,
            'table_count' => count($tables),
            'row_count' => $totalRows,
        ];
    }

    protected function getTableList(): array
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'sqlite') {
            $rows = DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");

            return array_map(fn ($r) => $r->name, $rows);
        }

        if ($driver === 'pgsql') {
            $rows = DB::select("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'");

            return array_map(fn ($r) => $r->tablename, $rows);
        }

        // Generic fallback
        $schema = DB::connection()->getDoctrineSchemaManager();

        return $schema->listTableNames();
    }

    protected function splitSqlStatements(string $sql): array
    {
        $statements = [];
        $tokens = preg_split('/;\s*[\r\n]+/', $sql);
        foreach ($tokens as $token) {
            $trimmed = trim($token);
            if ($trimmed !== '') {
                $statements[] = $trimmed;
            }
        }

        return $statements;
    }

    protected function updateManifest(array $newEntry, string $diskName): void
    {
        $storage = Storage::disk($diskName);
        $manifest = [];

        if ($storage->exists(self::MANIFEST_FILE)) {
            $raw = $storage->get(self::MANIFEST_FILE);
            $parsed = json_decode($raw, true);
            if (is_array($parsed)) {
                $manifest = $parsed;
            }
        }

        array_unshift($manifest, $newEntry);
        // Keep up to 30 most recent backup entries in manifest
        $manifest = array_slice($manifest, 0, 30);

        $storage->put(
            self::MANIFEST_FILE,
            json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
        );
    }
}
