<?php

namespace App\Jobs;

use App\Models\OutboxEvent;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class ProcessOutboxEvent implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $tries = 5;

    public int $uniqueFor = 3600;

    public function __construct(
        public readonly string $eventId,
    ) {
        $this->onQueue('outbox');
    }

    public function uniqueId(): string
    {
        return $this->eventId;
    }

    /**
     * @return list<int>
     */
    public function backoff(): array
    {
        return [15, 60, 300, 900];
    }

    public function handle(): void
    {
        DB::transaction(function (): void {
            $event = OutboxEvent::query()
                ->whereKey($this->eventId)
                ->lockForUpdate()
                ->first();
            if (! $event || $event->processed_at) {
                return;
            }

            Log::info('aio.outbox.processed', [
                'eventId' => $event->id,
                'eventType' => $event->event_type,
                'organizationId' => $event->organization_id,
                'aggregateType' => $event->aggregate_type,
                'aggregateId' => $event->aggregate_id,
            ]);
            $event->forceFill([
                'processed_at' => now(),
                'attempts' => $event->attempts + 1,
                'last_error' => null,
            ])->save();
        });
    }

    public function failed(?Throwable $exception): void
    {
        OutboxEvent::query()
            ->whereKey($this->eventId)
            ->increment('attempts', 1, [
                'last_error' => $exception
                    ? 'Job failed: '.$exception::class
                    : 'Job failed: unknown error',
            ]);
    }
}
