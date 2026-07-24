<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Content\StoreContentRequest;
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
}
