<?php

namespace App\Console\Commands;

use App\Models\ContentAccessLog;
use App\Models\PushDeviceToken;
use App\Models\UserSession;
use App\Models\VerificationCode;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class PurgeExpiredRetentionData extends Command
{
    protected $signature = 'privacy:purge-expired-data';

    protected $description = 'Purge expired technical telemetry logs, stale database sessions, and revoked tokens past retention schedules';

    public function handle(): int
    {
        $technicalRetentionDays = max(
            1,
            (int) config('aio.privacy.technical_retention_days'),
        );
        $transientRetentionDays = max(
            1,
            (int) config('aio.privacy.transient_retention_days'),
        );
        $technicalCutoff = now()->subDays($technicalRetentionDays);
        $transientCutoff = now()->subDays($transientRetentionDays);

        // 1. Purge content access telemetry older than 90 days
        $purgedAccessLogs = 0;
        if (DB::getSchemaBuilder()->hasTable('content_access_logs')) {
            $purgedAccessLogs = ContentAccessLog::query()
                ->where('created_at', '<', $technicalCutoff)
                ->delete();
        }

        // 2. Purge stale database sessions older than 90 days
        $purgedDbSessions = 0;
        if (DB::getSchemaBuilder()->hasTable('sessions')) {
            $purgedDbSessions = DB::table('sessions')
                ->where('last_activity', '<', $technicalCutoff->getTimestamp())
                ->delete();
        }

        // 3. Purge expired or revoked user session records older than 90 days
        $purgedUserSessions = 0;
        if (DB::getSchemaBuilder()->hasTable('user_sessions')) {
            $purgedUserSessions = UserSession::query()
                ->where(function ($query) use ($technicalCutoff): void {
                    $query->where('expires_at', '<', $technicalCutoff)
                        ->orWhere('revoked_at', '<', $technicalCutoff);
                })
                ->delete();
        }

        // 4. Purge revoked push device tokens older than 90 days
        $purgedPushTokens = 0;
        if (DB::getSchemaBuilder()->hasTable('push_device_tokens')) {
            $purgedPushTokens = PushDeviceToken::query()
                ->where('revoked_at', '<', $technicalCutoff)
                ->delete();
        }

        // 5. Purge expired verification codes older than 30 days
        $purgedCodes = 0;
        if (DB::getSchemaBuilder()->hasTable('verification_codes')) {
            $purgedCodes = VerificationCode::query()
                ->where('expires_at', '<', $transientCutoff)
                ->delete();
        }

        // 6. Purge expired password reset tokens older than 30 days
        $purgedPasswordTokens = 0;
        if (DB::getSchemaBuilder()->hasTable('password_reset_tokens')) {
            $purgedPasswordTokens = DB::table('password_reset_tokens')
                ->where('created_at', '<', $transientCutoff)
                ->delete();
        }

        $this->info(json_encode([
            'purged_content_access_logs' => $purgedAccessLogs,
            'purged_db_sessions' => $purgedDbSessions,
            'purged_user_sessions' => $purgedUserSessions,
            'purged_push_tokens' => $purgedPushTokens,
            'purged_verification_codes' => $purgedCodes,
            'purged_password_tokens' => $purgedPasswordTokens,
            'technical_retention_days' => $technicalRetentionDays,
            'transient_retention_days' => $transientRetentionDays,
            'executed_at' => now()->toIso8601String(),
        ], JSON_THROW_ON_ERROR));

        return self::SUCCESS;
    }
}
