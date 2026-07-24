<?php

namespace Tests\Feature;

use App\Jobs\ProcessOutboxEvent;
use App\Models\OutboxEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use RuntimeException;
use Tests\TestCase;

class OutboxProcessingTest extends TestCase
{
    use RefreshDatabase;

    public function test_dispatch_command_queues_available_events_only(): void
    {
        Queue::fake();
        $available = $this->event();
        $future = $this->event(['available_at' => now()->addHour()]);
        $processed = $this->event(['processed_at' => now()]);

        $this->artisan('aio:dispatch-outbox')
            ->expectsOutput('Dispatched 1 outbox events.')
            ->assertSuccessful();

        Queue::assertPushed(
            ProcessOutboxEvent::class,
            fn (ProcessOutboxEvent $job): bool => $job->eventId === $available->id,
        );
        Queue::assertNotPushed(
            ProcessOutboxEvent::class,
            fn (ProcessOutboxEvent $job): bool => in_array(
                $job->eventId,
                [$future->id, $processed->id],
                true,
            ),
        );
    }

    public function test_processing_is_idempotent_and_failure_details_are_safe(): void
    {
        $event = $this->event();
        $job = new ProcessOutboxEvent($event->id);

        $job->handle();
        $job->handle();

        $event->refresh();
        $this->assertNotNull($event->processed_at);
        $this->assertSame(1, $event->attempts);

        $secret = 'Bearer production-secret-token';
        $job->failed(new RuntimeException($secret));
        $event->refresh();

        $this->assertSame(2, $event->attempts);
        $this->assertSame(
            'Job failed: '.RuntimeException::class,
            $event->last_error,
        );
        $this->assertStringNotContainsString($secret, $event->last_error);
    }

    /**
     * Create a transactional outbox event.
     *
     * @param  array<string, mixed>  $overrides
     */
    private function event(array $overrides = []): OutboxEvent
    {
        return OutboxEvent::query()->create([
            'organization_id' => null,
            'event_type' => 'test.event',
            'aggregate_type' => 'test',
            'aggregate_id' => fake()->uuid(),
            'payload' => ['id' => fake()->uuid()],
            'available_at' => now(),
            'processed_at' => null,
            'attempts' => 0,
            'created_at' => now(),
            ...$overrides,
        ]);
    }
}
