<?php

namespace App\Jobs;

use App\Contracts\Notifications\PushNotificationProvider;
use App\Models\Notification;
use App\Models\NotificationPreference;
use App\Models\PushDeviceToken;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class SendPushNotification implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $uniqueFor = 600;

    public function __construct(
        public readonly string $notificationId,
    ) {
        $this->onQueue((string) config('push.queue', 'notifications'));
    }

    public function uniqueId(): string
    {
        return $this->notificationId;
    }

    /**
     * @return list<int>
     */
    public function backoff(): array
    {
        return [30, 120, 600];
    }

    public function handle(PushNotificationProvider $provider): void
    {
        $notification = Notification::query()
            ->whereKey($this->notificationId)
            ->first();

        if (! $notification || $this->alreadyAttempted($notification)) {
            return;
        }

        if (! $this->pushAllowed($notification)) {
            $this->storeDelivery($notification, [
                'status' => 'skipped',
                'reason' => 'preference_disabled',
                'sent' => 0,
                'failed' => 0,
            ]);

            return;
        }

        $tokens = PushDeviceToken::query()
            ->where('user_id', $notification->user_id)
            ->whereNull('revoked_at')
            ->latest('last_registered_at')
            ->limit((int) config('push.max_tokens_per_job', 100))
            ->pluck('token')
            ->values()
            ->all();

        if ($tokens === []) {
            $this->storeDelivery($notification, [
                'status' => 'skipped',
                'reason' => 'no_active_tokens',
                'sent' => 0,
                'failed' => 0,
            ]);

            return;
        }

        $result = $provider->send($tokens, $this->payload($notification));
        $this->storeDelivery($notification, [
            'status' => $result['skipped'] ? 'skipped' : 'attempted',
            'reason' => $result['skipped'] ? 'provider_disabled' : null,
            'sent' => $result['sent'],
            'failed' => $result['failed'],
        ]);
    }

    public function failed(?Throwable $exception): void
    {
        $notification = Notification::query()->whereKey($this->notificationId)->first();
        if (! $notification) {
            return;
        }

        $this->storeDelivery($notification, [
            'status' => 'failed',
            'reason' => $exception ? $exception::class : 'unknown',
            'sent' => 0,
            'failed' => 1,
        ]);
        Log::warning('aio.push.failed', [
            'notificationId' => $this->notificationId,
            'errorClass' => $exception ? $exception::class : null,
        ]);
    }

    private function pushAllowed(Notification $notification): bool
    {
        $preference = NotificationPreference::query()
            ->where('user_id', $notification->user_id)
            ->where(function ($query) use ($notification): void {
                $query
                    ->where('organization_id', $notification->organization_id)
                    ->orWhereNull('organization_id');
            })
            ->orderByRaw('organization_id IS NULL')
            ->first();

        if (! $preference || ! $preference->push_enabled) {
            return false;
        }

        return match ($notification->type) {
            'booking_submitted',
            'booking_confirmed',
            'booking_rejected',
            'booking_cancelled' => $preference->booking_updates,
            'announcement' => $preference->announcements,
            'subscription_expiring',
            'subscription_expired' => $preference->subscription_reminders,
            default => true,
        };
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(Notification $notification): array
    {
        return [
            'notification' => [
                'title' => $this->safeTitle($notification),
                'body' => $this->safeBody($notification),
            ],
            'data' => [
                'notificationId' => $notification->id,
                'type' => $notification->type,
                'priority' => $notification->priority,
                'organizationId' => $notification->organization_id,
                'targetType' => $notification->target_type,
                'targetId' => $notification->target_id,
                'routeName' => $this->routeName($notification),
            ],
        ];
    }

    private function safeTitle(Notification $notification): string
    {
        return match ($notification->type) {
            'announcement' => 'New announcement',
            'subscription_expiring' => 'Subscription expires soon',
            'booking_confirmed' => 'Booking confirmed',
            default => $notification->title,
        };
    }

    private function safeBody(Notification $notification): string
    {
        return match ($notification->type) {
            'announcement' => 'Open AIN to read the latest announcement.',
            'subscription_expiring' => 'Open AIN to review your course access.',
            default => $notification->body,
        };
    }

    private function routeName(Notification $notification): ?string
    {
        return match ($notification->type) {
            'booking_confirmed',
            'booking_rejected',
            'booking_cancelled',
            'booking_submitted' => 'student.bookings',
            'announcement' => 'student.notifications',
            'subscription_expiring',
            'subscription_expired' => 'student.content',
            default => null,
        };
    }

    private function alreadyAttempted(Notification $notification): bool
    {
        return isset(($notification->data ?? [])['pushDelivery']['attemptedAt']);
    }

    /**
     * @param  array{status:string,reason:?string,sent:int,failed:int}  $delivery
     */
    private function storeDelivery(Notification $notification, array $delivery): void
    {
        $data = $notification->data ?? [];
        $data['pushDelivery'] = [
            ...$delivery,
            'attemptedAt' => now()->toISOString(),
        ];
        $notification->forceFill(['data' => $data])->save();
    }
}
