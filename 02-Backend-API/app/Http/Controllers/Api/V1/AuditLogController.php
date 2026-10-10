<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\ContentAccessLog;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function platform(Request $request): JsonResponse
    {
        $items = AuditLog::query()
            ->when(
                $request->filled('organizationId'),
                fn ($query) => $query->where(
                    'organization_id',
                    $request->string('organizationId'),
                ),
            )
            ->when(
                $request->filled('action'),
                fn ($query) => $query->where('action', $request->string('action')),
            )
            ->latest('created_at')
            ->paginate(min($request->integer('perPage', 50), 100));

        return ApiResponse::success($request, $items->items(), [
            'currentPage' => $items->currentPage(),
            'lastPage' => $items->lastPage(),
            'total' => $items->total(),
        ]);
    }

    public function organization(Request $request): JsonResponse
    {
        $organization = $request->attributes->get('active_organization');
        $items = AuditLog::query()
            ->where('organization_id', $organization->id)
            ->when(
                $request->filled('action'),
                fn ($query) => $query->where('action', $request->string('action')),
            )
            ->latest('created_at')
            ->paginate(min($request->integer('perPage', 50), 100));

        return ApiResponse::success($request, $items->items(), [
            'currentPage' => $items->currentPage(),
            'lastPage' => $items->lastPage(),
            'total' => $items->total(),
        ]);
    }

    public function contentAccess(Request $request): JsonResponse
    {
        $organization = $request->attributes->get('active_organization');
        $items = ContentAccessLog::query()
            ->with([
                'contentItem:id,title,type,room_id',
                'user:id,name,email',
            ])
            ->where('organization_id', $organization->id)
            ->when(
                $request->filled('result'),
                fn ($query) => $query->where('result', $request->string('result')),
            )
            ->when(
                $request->filled('action'),
                fn ($query) => $query->where('action', $request->string('action')),
            )
            ->latest('created_at')
            ->paginate(min($request->integer('perPage', 50), 100));

        return ApiResponse::success($request, $items->items(), [
            'currentPage' => $items->currentPage(),
            'lastPage' => $items->lastPage(),
            'total' => $items->total(),
        ]);
    }

    public function securityEvents(Request $request): JsonResponse
    {
        $organization = $request->attributes->get('active_organization');
        $perPage = min($request->integer('perPage', 50), 100);

        $contentEvents = ContentAccessLog::query()
            ->with([
                'contentItem:id,title,type,room_id',
                'user:id,name,email',
            ])
            ->where('organization_id', $organization->id)
            ->when(
                $request->filled('result'),
                fn ($query) => $query->where('result', $request->string('result')),
            )
            ->when(
                $request->filled('memberId'),
                fn ($query) => $query->where('user_id', $request->string('memberId')),
            )
            ->latest('created_at')
            ->limit($perPage)
            ->get()
            ->map(fn (ContentAccessLog $log): array => [
                'id' => $log->id,
                'source' => 'content_access',
                'event' => $this->normalizeSecurityEvent($log->action),
                'rawAction' => $log->action,
                'result' => $log->result,
                'user' => $log->user ? [
                    'id' => $log->user->id,
                    'name' => $log->user->name,
                    'email' => $log->user->email,
                ] : null,
                'contentItem' => $log->contentItem ? [
                    'id' => $log->contentItem->id,
                    'title' => $log->contentItem->title,
                    'type' => $log->contentItem->type,
                ] : null,
                'metadata' => $log->metadata,
                'ipAddress' => $log->ip_address,
                'userAgent' => $log->user_agent,
                'createdAt' => $log->created_at,
            ]);

        $auditEvents = AuditLog::query()
            ->with('actor:id,name,email')
            ->where('organization_id', $organization->id)
            ->where(function ($query): void {
                $query
                    ->where('action', 'like', 'device.%')
                    ->orWhere('action', 'like', 'session.%')
                    ->orWhere('action', 'like', 'device_%')
                    ->orWhere('action', 'new_device_detected')
                    ->orWhere('action', 'like', 'login_%')
                    ->orWhere('action', 'like', 'security.%');
            })
            ->when(
                $request->filled('memberId'),
                fn ($query) => $query->where(function ($memberQuery) use ($request): void {
                    $memberQuery
                        ->where('actor_id', $request->string('memberId'))
                        ->orWhere('entity_id', $request->string('memberId'));
                }),
            )
            ->latest('created_at')
            ->limit($perPage)
            ->get()
            ->map(fn (AuditLog $log): array => [
                'id' => $log->id,
                'source' => 'audit',
                'event' => $this->normalizeSecurityEvent($log->action),
                'rawAction' => $log->action,
                'result' => $this->auditResult($log->action),
                'user' => $log->actor ? [
                    'id' => $log->actor->id,
                    'name' => $log->actor->name,
                    'email' => $log->actor->email,
                ] : null,
                'contentItem' => null,
                'metadata' => $log->metadata,
                'ipAddress' => $log->ip_address,
                'userAgent' => $log->user_agent,
                'createdAt' => $log->created_at,
            ]);

        $events = collect($contentEvents->all())
            ->merge($auditEvents->all())
            ->when(
                $request->filled('event'),
                fn ($collection) => $collection->where(
                    'event',
                    $request->string('event')->toString(),
                ),
            )
            ->sortByDesc('createdAt')
            ->values()
            ->take($perPage);

        return ApiResponse::success($request, $events);
    }

    private function normalizeSecurityEvent(string $action): string
    {
        return match ($action) {
            'viewer_opened',
            'view_session' => 'content_opened',
            'viewer_closed' => 'content_closed',
            'viewer_failed' => 'content_failed',
            'viewer_download_blocked',
            'download_blocked' => 'download_blocked',
            'viewer_right_click_blocked' => 'right_click_blocked',
            'viewer_shortcut_blocked' => 'shortcut_blocked',
            'session.revoked' => 'session_revoked',
            'device.approved' => 'device_approved',
            'device.blocked' => 'device_blocked',
            'device.revoked' => 'device_revoked',
            default => str_replace('.', '_', $action),
        };
    }

    private function auditResult(string $action): string
    {
        return match ($action) {
            'device.blocked',
            'device.revoked',
            'session.revoked' => 'warning',
            default => 'allowed',
        };
    }
}
