<?php

namespace App\Console\Commands;

use App\Models\AccountDeletionRequest;
use App\Models\Booking;
use App\Models\ContentItem;
use App\Models\FileAsset;
use App\Models\GuardianStudentLink;
use App\Models\LessonBooking;
use App\Models\Notification;
use App\Models\NotificationPreference;
use App\Models\Payment;
use App\Models\SupportRequest;
use App\Models\User;
use App\Models\VerificationCode;
use App\Services\Operations\OperationRecorder;
use Illuminate\Console\Command;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProcessScheduledAccountDeletions extends Command
{
    protected $signature = 'privacy:process-deletions';

    protected $description = 'Process due scheduled account deletion requests, anonymize retained records, revoke sessions/tokens, and purge personal data';

    public function handle(OperationRecorder $recorder): int
    {
        $now = now();
        $dueRequests = AccountDeletionRequest::query()
            ->where('status', 'pending')
            ->where('scheduled_for', '<=', $now)
            ->pluck('id');

        $processedCount = 0;
        $failedCount = 0;

        foreach ($dueRequests as $requestId) {
            try {
                DB::transaction(function () use ($requestId, $recorder, &$processedCount): void {
                    $request = AccountDeletionRequest::query()
                        ->whereKey($requestId)
                        ->lockForUpdate()
                        ->first();

                    if (! $request || $request->status !== 'pending') {
                        return;
                    }

                    $user = User::withTrashed()
                        ->whereKey($request->user_id)
                        ->lockForUpdate()
                        ->first();

                    if ($user) {
                        $anonShort = substr($user->id, 0, 8);
                        $anonEmail = "deleted-{$user->id}@anonymized.local";

                        // 1. Revoke all Sanctum API tokens
                        $user->tokens()->delete();

                        // 2. Revoke all active user sessions
                        $user->sessions()->delete();

                        // 3. Purge Laravel database session table if driver is database
                        if (DB::getSchemaBuilder()->hasTable('sessions')) {
                            DB::table('sessions')->where('user_id', $user->id)->delete();
                        }

                        // 4. Purge password reset tokens
                        if (DB::getSchemaBuilder()->hasTable('password_reset_tokens')) {
                            DB::table('password_reset_tokens')
                                ->where('email', $user->email)
                                ->orWhere('email', $user->normalized_email)
                                ->delete();
                        }

                        // 5. Purge bound hardware/device records and push tokens
                        $user->devices()->delete();
                        $user->pushDeviceTokens()->delete();

                        // 6. Purge notification preferences and in-app notifications
                        NotificationPreference::query()->where('user_id', $user->id)->delete();
                        Notification::query()->where('user_id', $user->id)->delete();

                        // 7. Purge any pending verification codes
                        VerificationCode::query()->where('user_id', $user->id)->delete();

                        // 8. Sever guardian links
                        GuardianStudentLink::query()
                            ->where('student_id', $user->id)
                            ->orWhere('guardian_id', $user->id)
                            ->delete();

                        // 9. Remove non-essential personal files uploaded by user (keep academy content intact)
                        $assets = FileAsset::query()->where('uploaded_by', $user->id)->get();
                        foreach ($assets as $asset) {
                            $inUse = ContentItem::query()->where('file_asset_id', $asset->id)->exists();
                            if (! $inUse) {
                                if (Storage::disk($asset->disk)->exists($asset->path)) {
                                    $deleted = Storage::disk($asset->disk)->delete($asset->path);
                                    if (! $deleted) {
                                        throw new \RuntimeException("Failed to delete physical file asset {$asset->id} at {$asset->path} on disk {$asset->disk}");
                                    }
                                }
                                $asset->delete();
                            }
                        }

                        // 10. Clean user avatar file from disk if present
                        if ($user->avatar_path) {
                            if (Storage::disk('public')->exists($user->avatar_path)) {
                                $deletedAvatar = Storage::disk('public')->delete($user->avatar_path);
                                if (! $deletedAvatar) {
                                    throw new \RuntimeException("Failed to delete user avatar at {$user->avatar_path}");
                                }
                            }
                            $user->avatar_path = null;
                        }

                        // 11. Anonymize IP address and user-agent in content access logs
                        if (DB::getSchemaBuilder()->hasTable('content_access_logs')) {
                            DB::table('content_access_logs')
                                ->where('user_id', $user->id)
                                ->update([
                                    'ip_address' => null,
                                    'user_agent' => null,
                                ]);
                        }

                        // 12. Anonymize user support requests
                        SupportRequest::query()
                            ->where('user_id', $user->id)
                            ->orWhere('email', $user->email)
                            ->orWhere('email', $user->normalized_email)
                            ->update([
                                'name' => "Anonymized User ({$anonShort})",
                                'email' => $anonEmail,
                                'message' => '[User requested account deletion - personal message redacted]',
                                'notes' => null,
                            ]);

                        // 13. Anonymize primary course bookings (bookings table)
                        Booking::query()
                            ->where('student_id', $user->id)
                            ->orWhere('email', $user->email)
                            ->orWhere('normalized_email', $user->normalized_email)
                            ->update([
                                'student_name' => "Deleted Student ({$anonShort})",
                                'email' => $anonEmail,
                                'normalized_email' => $anonEmail,
                                'phone' => '+000000000000',
                                'note' => null,
                                'internal_note' => null,
                            ]);

                        // 14. Sanitize student personal notes & phones from private lesson bookings
                        LessonBooking::query()->where('student_id', $user->id)->update([
                            'student_phone' => null,
                            'student_note' => null,
                        ]);

                        // 15. Anonymize payment metadata (retaining audit and tax compliance ledger without PII)
                        Payment::query()->where('user_id', $user->id)->get()->each(function (Payment $payment): void {
                            $meta = Arr::only($payment->metadata ?? [], [
                                'invoice_no',
                                'order_id',
                                'mode',
                                'client_secret_hash',
                                'webhook_processed_at',
                                'webhook_event',
                            ]);
                            $meta['anonymized_at'] = now()->toIso8601String();
                            $payment->metadata = $meta;
                            $payment->save();
                        });

                        // 16. Anonymize user profile credentials and PII
                        $user->name = "Deleted User ({$anonShort})";
                        $user->email = $anonEmail;
                        $user->normalized_email = $anonEmail;
                        $user->password = bcrypt(Str::random(40));
                        $user->remember_token = null;
                        $user->avatar_path = null;
                        $user->save();

                        // 17. Soft-delete user account
                        if (! $user->trashed()) {
                            $user->delete();
                        }

                        // 18. Record immutable audit log
                        $recorder->record(
                            action: 'privacy.account.deleted',
                            entityType: 'user',
                            entityId: $user->id,
                            organizationId: null,
                            actorId: null,
                            metadata: [
                                'deletion_request_id' => $request->id,
                                'scheduled_for' => $request->scheduled_for?->toIso8601String(),
                                'anonymized_at' => now()->toIso8601String(),
                                'retention_policy' => 'financial_and_academic_records_anonymized_5y_retention',
                            ]
                        );
                    }

                    // 19. Mark deletion request as completed
                    $request->update([
                        'status' => 'completed',
                        'completed_at' => now(),
                        'reason' => null,
                        'failure_reason' => null,
                    ]);

                    $processedCount++;
                });
            } catch (\Throwable $e) {
                $failedCount++;
                Log::error("Scheduled account deletion failed for request {$requestId}: {$e->getMessage()}", [
                    'request_id' => $requestId,
                    'error' => $e->getMessage(),
                ]);

                // Record failure status and reason on the request record
                AccountDeletionRequest::query()
                    ->whereKey($requestId)
                    ->update([
                        'status' => 'failed',
                        'failure_reason' => Str::limit($e->getMessage(), 1000),
                    ]);

                $this->error("Failed processing deletion request {$requestId}: {$e->getMessage()}");
            }
        }

        $this->info(json_encode([
            'due_requests_found' => count($dueRequests),
            'processed_count' => $processedCount,
            'failed_count' => $failedCount,
        ], JSON_THROW_ON_ERROR));

        return $failedCount > 0 ? self::FAILURE : self::SUCCESS;
    }
}
