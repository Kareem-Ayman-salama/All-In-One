<?php

namespace App\Console\Commands;

use App\Jobs\ProcessOutboxEvent;
use App\Models\OutboxEvent;
use Illuminate\Console\Command;

class DispatchOutboxCommand extends Command
{
    protected $signature = 'aio:dispatch-outbox {--limit=200}';

    protected $description = 'Dispatch unprocessed transactional outbox events';

    public function handle(): int
    {
        $limit = min(max((int) $this->option('limit'), 1), 1000);
        $events = OutboxEvent::query()
            ->whereNull('processed_at')
            ->where('available_at', '<=', now())
            ->where('attempts', '<', 10)
            ->oldest('created_at')
            ->limit($limit)
            ->get('id');

        foreach ($events as $event) {
            ProcessOutboxEvent::dispatch($event->id);
        }

        $this->info("Dispatched {$events->count()} outbox events.");

        return self::SUCCESS;
    }
}
