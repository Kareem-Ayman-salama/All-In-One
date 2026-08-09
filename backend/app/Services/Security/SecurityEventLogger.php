<?php

namespace App\Services\Security;

use App\Models\AuditLog;
use App\Models\ContentAccessLog;
use Illuminate\Http\Request;

class SecurityEventLogger
{
    /**
     * @param  array<string, mixed>  $metadata
     */
    public function record(
        string $event,
        ?string $organizationId,
        ?string $actorId,
        ?string $entityType = null,
        ?string $entityId = null,
        array $metadata = [],
        ?Request $request = null,
    ): AuditLog {
        return AuditLog::query()->create([
            'organization_id' => $organizationId,
            'actor_id' => $actorId,
            'action' => $event,
            'entity_type' => $entityType ?: 'security_event',
            'entity_id' => $entityId,
            'metadata' => $metadata,
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
            'created_at' => now(),
        ]);
    }

    /**
     * @param  array<string, mixed>  $metadata
     */
    public function recordContent(
        string $event,
        string $result,
        string $organizationId,
        string $contentItemId,
        string $userId,
        array $metadata = [],
        ?Request $request = null,
    ): ContentAccessLog {
        return ContentAccessLog::query()->create([
            'organization_id' => $organizationId,
            'content_item_id' => $contentItemId,
            'user_id' => $userId,
            'action' => $event,
            'result' => $result,
            'metadata' => $metadata,
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
            'created_at' => now(),
        ]);
    }

    public function normalizeViewerEvent(string $event): string
    {
        return match ($event) {
            'opened' => 'content_opened',
            'closed' => 'content_closed',
            'failed' => 'content_failed',
            'download_blocked' => 'download_blocked',
            'right_click_blocked' => 'right_click_blocked',
            'shortcut_blocked' => 'shortcut_blocked',
            'watermark_rendered' => 'watermark_rendered',
            'screenshot_warning' => 'screenshot_warning',
            'screen_capture_started' => 'screen_capture_started',
            'screen_capture_stopped' => 'screen_capture_stopped',
            default => "viewer_{$event}",
        };
    }
}
