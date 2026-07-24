<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Content\StoreContentRequest;
use App\Http\Requests\Content\StoreContentViewerAuditRequest;
use App\Models\ContentAccessLog;
use App\Models\ContentItem;
use App\Models\FileAsset;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Services\Operations\OperationRecorder;
use App\Services\Plans\EntitlementService;
use App\Services\Workspace\RoomAccessService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ContentController extends Controller
{
    public function index(
        Request $request,
        string $organization,
        RoomAccessService $access,
    ): JsonResponse {
        $activeOrganization = $this->organization($request);
        $roomId = $request->string('roomId')->toString();
        if ($roomId !== '') {
            $access->ensureCanRead(
                $request->user(),
                $this->membership($request),
                $roomId,
            );
        }

        $query = ContentItem::query()
            ->with('fileAsset', 'room:id,name', 'creator:id,name')
            ->where('organization_id', $activeOrganization->id)
            ->when($roomId !== '', fn ($builder) => $builder->where('room_id', $roomId))
            ->where(function ($builder): void {
                $builder
                    ->whereNull('available_from')
                    ->orWhere('available_from', '<=', now());
            })
            ->where(function ($builder): void {
                $builder
                    ->whereNull('available_until')
                    ->orWhere('available_until', '>=', now());
            })
            ->latest();
        $access->scopeVisibleRooms(
            $query,
            $request->user(),
            $this->membership($request),
        );
        $items = $query->paginate(min($request->integer('perPage', 20), 100));

        return ApiResponse::success($request, $items->items(), [
            'currentPage' => $items->currentPage(),
            'lastPage' => $items->lastPage(),
            'total' => $items->total(),
        ]);
    }

    public function store(
        StoreContentRequest $request,
        OperationRecorder $recorder,
        EntitlementService $entitlements,
    ): JsonResponse {
        $organization = $this->organization($request);
        $result = DB::transaction(function () use (
            $request,
            $organization,
            $recorder,
            $entitlements,
        ): ContentItem {
            $asset = null;
            if ($request->hasFile('file')) {
                $file = $request->file('file');
                Organization::query()
                    ->whereKey($organization->id)
                    ->lockForUpdate()
                    ->firstOrFail();
                $entitlements->assertCurrentCount(
                    $organization,
                    'storage_bytes',
                    (int) FileAsset::query()
                        ->where('organization_id', $organization->id)
                        ->whereIn('status', ['pending', 'processing', 'ready'])
                        ->sum('size_bytes'),
                    $file->getSize(),
                );
                $disk = config('filesystems.default');
                $path = $file->store(
                    "organizations/{$organization->id}/content",
                    $disk,
                );
                if (! $path) {
                    throw new ApiException(
                        'FILE_UPLOAD_FAILED',
                        'The file could not be stored.',
                        500,
                    );
                }

                $asset = FileAsset::query()->create([
                    'organization_id' => $organization->id,
                    'uploaded_by' => $request->user()->id,
                    'disk' => $disk,
                    'path' => $path,
                    'original_name' => $this->safeOriginalName(
                        $file->getClientOriginalName(),
                    ),
                    'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
                    'size_bytes' => $file->getSize(),
                    'checksum' => hash_file('sha256', $file->getRealPath()),
                    'status' => 'ready',
                    'metadata' => [],
                ]);
            }

            $item = ContentItem::query()->create([
                'organization_id' => $organization->id,
                'room_id' => $request->validated('roomId'),
                'file_asset_id' => $asset?->id,
                'created_by' => $request->user()->id,
                'title' => $request->validated('title'),
                'description' => $request->validated('description'),
                'type' => $request->validated('type'),
                'external_url' => $request->validated('externalUrl'),
                'download_allowed' => $request->boolean('downloadAllowed'),
                'watermark_enabled' => $request->has('watermarkEnabled')
                    ? $request->boolean('watermarkEnabled')
                    : true,
                'available_from' => $request->validated('availableFrom'),
                'available_until' => $request->validated('availableUntil'),
                'status' => $request->validated('status', 'published'),
            ]);
            $recorder->record(
                'content.created',
                'content_item',
                $item->id,
                $organization->id,
                $request->user()->id,
                ['roomId' => $item->room_id, 'type' => $item->type],
                ['contentId' => $item->id],
                $request,
            );

            return $item->load('fileAsset');
        });

        return ApiResponse::success($request, $result, status: 201);
    }

    public function download(
        Request $request,
        string $organization,
        string $content,
        RoomAccessService $access,
    ): StreamedResponse {
        $item = ContentItem::query()
            ->with('fileAsset')
            ->where('organization_id', $this->organization($request)->id)
            ->where('id', $content)
            ->first();

        if (! $item || ! $item->fileAsset) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Content file not found.', 404);
        }
        $this->assertContentIsAvailable($item);
        $access->ensureCanRead(
            $request->user(),
            $this->membership($request),
            $item->room_id,
        );

        if (! $item->download_allowed) {
            ContentAccessLog::query()->create([
                'organization_id' => $item->organization_id,
                'content_item_id' => $item->id,
                'user_id' => $request->user()->id,
                'action' => 'download',
                'result' => 'denied',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'created_at' => now(),
            ]);
            throw new ApiException(
                'DOWNLOAD_DISABLED',
                'Downloading is disabled for this content.',
                403,
            );
        }

        ContentAccessLog::query()->create([
            'organization_id' => $item->organization_id,
            'content_item_id' => $item->id,
            'user_id' => $request->user()->id,
            'action' => 'download',
            'result' => 'allowed',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return Storage::disk($item->fileAsset->disk)->download(
            $item->fileAsset->getRawOriginal('path'),
            Str::ascii($item->fileAsset->original_name),
        );
    }

    public function viewSession(
        Request $request,
        string $organization,
        string $content,
        RoomAccessService $access,
    ): JsonResponse {
        $item = ContentItem::query()
            ->with('fileAsset')
            ->where('organization_id', $this->organization($request)->id)
            ->where('id', $content)
            ->first();

        if (! $item || ! $item->fileAsset) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Content file not found.', 404);
        }
        $this->assertContentIsAvailable($item);
        $access->ensureCanRead(
            $request->user(),
            $this->membership($request),
            $item->room_id,
        );

        $expiresAt = now()->addMinutes(5);
        ContentAccessLog::query()->create([
            'organization_id' => $item->organization_id,
            'content_item_id' => $item->id,
            'user_id' => $request->user()->id,
            'action' => 'view_session',
            'result' => 'allowed',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return ApiResponse::success($request, [
            'url' => URL::temporarySignedRoute(
                'api.v1.content-view.show',
                $expiresAt,
                ['content' => $item->id],
            ),
            'expiresAt' => $expiresAt,
            'mimeType' => $item->fileAsset->mime_type,
            'sizeBytes' => $item->fileAsset->size_bytes,
            'downloadAllowed' => $item->download_allowed,
            'status' => $item->fileAsset->status,
            'watermark' => $item->watermark_enabled ? [
                'enabled' => true,
                'userId' => $request->user()->id,
                'userName' => $request->user()->name,
                'organizationId' => $item->organization_id,
                'contentId' => $item->id,
            ] : ['enabled' => false],
        ]);
    }

    public function viewSigned(Request $request, string $content): StreamedResponse
    {
        $item = ContentItem::query()
            ->with('fileAsset')
            ->where('id', $content)
            ->first();

        if (! $item || ! $item->fileAsset) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Content file not found.', 404);
        }
        $this->assertContentIsAvailable($item);

        return Storage::disk($item->fileAsset->disk)->response(
            $item->fileAsset->getRawOriginal('path'),
            Str::ascii($item->fileAsset->original_name),
            [
                'Content-Disposition' => 'inline; filename="'
                    .Str::ascii($item->fileAsset->original_name)
                    .'"',
                'Cache-Control' => 'private, no-store, max-age=0',
                'X-Content-Type-Options' => 'nosniff',
            ],
        );
    }

    public function viewerAudit(
        StoreContentViewerAuditRequest $request,
        string $organization,
        string $content,
        RoomAccessService $access,
    ): JsonResponse {
        $item = ContentItem::query()
            ->with('fileAsset')
            ->where('organization_id', $this->organization($request)->id)
            ->where('id', $content)
            ->first();

        if (! $item || ! $item->fileAsset) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Content file not found.', 404);
        }
        $access->ensureCanRead(
            $request->user(),
            $this->membership($request),
            $item->room_id,
        );

        $event = $request->string('event')->toString();
        $log = ContentAccessLog::query()->create([
            'organization_id' => $item->organization_id,
            'content_item_id' => $item->id,
            'user_id' => $request->user()->id,
            'action' => "viewer_{$event}",
            'result' => $request->validated('result', $this->defaultViewerResult($event)),
            'metadata' => [
                'viewerSessionId' => $request->validated('viewerSessionId'),
                'page' => $request->validated('page'),
                'positionSeconds' => $request->validated('positionSeconds'),
                'message' => $request->validated('message'),
                'platform' => $request->header('X-AIO-Platform'),
                'appVersion' => $request->header('X-AIO-App-Version'),
            ],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return ApiResponse::success($request, [
            'logged' => true,
            'id' => $log->id,
        ], status: 201);
    }

    public function destroy(
        Request $request,
        string $organization,
        string $content,
        OperationRecorder $recorder,
    ): JsonResponse {
        $item = ContentItem::query()
            ->with('fileAsset')
            ->where('organization_id', $this->organization($request)->id)
            ->where('id', $content)
            ->first();

        if (! $item) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Content item not found.', 404);
        }

        DB::transaction(function () use ($item, $request, $recorder): void {
            $asset = $item->fileAsset;
            $item->delete();

            if ($asset) {
                Storage::disk($asset->disk)->delete($asset->getRawOriginal('path'));
                $asset->update(['status' => 'deleted']);
            }

            $recorder->record(
                'content.deleted',
                'content_item',
                $item->id,
                $item->organization_id,
                $request->user()->id,
                ['title' => $item->title],
                ['contentId' => $item->id],
                $request,
            );
        });

        return ApiResponse::success($request, ['deleted' => true]);
    }

    private function organization(Request $request): Organization
    {
        return $request->attributes->get('active_organization');
    }

    private function membership(Request $request): OrganizationMembership
    {
        return $request->attributes->get('organization_membership');
    }

    private function safeOriginalName(string $name): string
    {
        $basename = basename(str_replace('\\', '/', $name));
        $sanitized = preg_replace(
            '/[^A-Za-z0-9._ -]/',
            '_',
            $basename,
        ) ?: 'download';

        $trimmed = trim($sanitized, '. ');

        return $trimmed === ''
            ? 'download'
            : Str::limit($trimmed, 180, '');
    }

    private function assertContentIsAvailable(ContentItem $item): void
    {
        if ($item->status !== 'published' || $item->fileAsset?->status !== 'ready') {
            throw new ApiException(
                'CONTENT_NOT_AVAILABLE',
                'This content is not available yet.',
                409,
            );
        }

        if (
            ($item->available_from && $item->available_from->isFuture())
            || ($item->available_until && $item->available_until->isPast())
        ) {
            throw new ApiException(
                'CONTENT_ACCESS_EXPIRED',
                'Access to this content is no longer available.',
                403,
            );
        }
    }

    private function defaultViewerResult(string $event): string
    {
        return match ($event) {
            'failed' => 'failed',
            'screenshot_warning',
            'screen_capture_started',
            'download_blocked' => 'warning',
            default => 'allowed',
        };
    }
}
