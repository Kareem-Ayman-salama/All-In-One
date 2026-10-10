<?php

namespace App\Services\Operations;

use App\Models\AuditLog;
use App\Models\OutboxEvent;
use Illuminate\Http\Request;

class OperationRecorder
{
    /**
     * Record an auditable domain operation and its reliable outbox event.
     *
     * @param  array<string, mixed>  $metadata
     * @param  array<string, mixed>  $payload
     */
    public function record(
        string $action,
        string $entityType,
        string $entityId,
        ?string $organizationId,
        ?string $actorId,
        array $metadata = [],
        array $payload = [],
        ?Request $request = null,
    ): void {
        AuditLog::query()->create([
            'organization_id' => $organizationId,
            'actor_id' => $actorId,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'metadata' => $metadata,
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
            'created_at' => now(),
        ]);

        OutboxEvent::query()->create([
            'organization_id' => $organizationId,
            'event_type' => $action,
            'aggregate_type' => $entityType,
            'aggregate_id' => $entityId,
            'payload' => $payload + $metadata,
            'available_at' => now(),
            'attempts' => 0,
            'created_at' => now(),
        ]);
    }
}
