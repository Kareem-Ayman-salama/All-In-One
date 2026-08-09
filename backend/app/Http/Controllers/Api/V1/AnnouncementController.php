<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Announcements\StoreAnnouncementRequest;
use App\Http\Requests\Announcements\UpdateAnnouncementRequest;
use App\Models\Announcement;
use App\Models\Notification;
use App\Models\NotificationPreference;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\RoomMembership;
use App\Services\Operations\OperationRecorder;
use App\Services\Workspace\RoomAccessService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnnouncementController extends Controller
{
    public function index(
        Request $request,
        RoomAccessService $access,
    ): JsonResponse {
        $roomId = $request->string('roomId')->toString();
        if ($roomId !== '') {
            $access->ensureCanRead(
                $request->user(),
                $this->membership($request),
                $roomId,
            );
        }

        $query = Announcement::query()
            ->where('organization_id', $this->organization($request)->id)
            ->when(
                $request->filled('roomId'),
                fn ($query) => $query->where('room_id', $request->string('roomId')),
            )
            ->where('published_at', '<=', now())
            ->orderByDesc('pinned')
            ->latest('published_at');
        $access->scopeVisibleRooms(
            $query,
            $request->user(),
            $this->membership($request),
            includeOrganizationWide: true,
        );
        $items = $query->paginate(min($request->integer('perPage', 20), 100));

        return ApiResponse::success($request, $items->items(), [
            'currentPage' => $items->currentPage(),
            'lastPage' => $items->lastPage(),
            'total' => $items->total(),
        ]);
    }

    public function store(
        StoreAnnouncementRequest $request,
        OperationRecorder $recorder,
    ): JsonResponse {
        $organization = $this->organization($request);
        $announcement = DB::transaction(function () use (
            $request,
            $organization,
            $recorder,
        ): Announcement {
            $item = Announcement::query()->create([
                'organization_id' => $organization->id,
                'room_id' => $request->validated('roomId'),
                'created_by' => $request->user()->id,
                'title' => $request->validated('title'),
                'title_ar' => $request->validated('titleAr'),
                'body' => $request->validated('body'),
                'body_ar' => $request->validated('bodyAr'),
                'audience' => $request->validated(
                    'audience',
                    $request->filled('roomId') ? 'room' : 'organization',
                ),
                'pinned' => $request->boolean('pinned'),
                'published_at' => $request->validated('publishedAt', now()),
            ]);

            $userIds = $item->room_id
                ? RoomMembership::query()
                    ->where('room_id', $item->room_id)
                    ->where('status', 'active')
                    ->pluck('user_id')
                : OrganizationMembership::query()
                    ->where('organization_id', $organization->id)
                    ->where('status', 'active')
                    ->pluck('user_id');
            foreach ($userIds->unique() as $userId) {
                $preference = NotificationPreference::query()
                    ->where('user_id', $userId)
                    ->where(function ($query) use ($organization): void {
                        $query
                            ->where('organization_id', $organization->id)
                            ->orWhereNull('organization_id');
                    })
                    ->orderByRaw('organization_id IS NULL')
                    ->first();
                if ($preference
                    && (! $preference->in_app_enabled
                        || ! $preference->announcements)) {
                    continue;
                }
                Notification::query()->create([
                    'user_id' => $userId,
                    'organization_id' => $organization->id,
                    'type' => 'announcement',
                    'priority' => $item->pinned ? 'high' : 'medium',
                    'title' => $item->title_ar ?: $item->title,
                    'body' => $item->body_ar ?: $item->body,
                    'target_type' => 'announcement',
                    'target_id' => $item->id,
                    'data' => [
                        'route' => $item->room_id
                            ? "/rooms/{$item->room_id}/announcements"
                            : '/announcements',
                    ],
                    'status' => 'unread',
                ]);
            }
            $recorder->record(
                'announcement.created',
                'announcement',
                $item->id,
                $organization->id,
                $request->user()->id,
                ['roomId' => $item->room_id],
                ['announcementId' => $item->id],
                $request,
            );

            return $item;
        });

        return ApiResponse::success($request, $announcement, status: 201);
    }

    public function update(
        UpdateAnnouncementRequest $request,
        string $organization,
        string $announcement,
        OperationRecorder $recorder,
    ): JsonResponse {
        $model = $this->announcement($request, $announcement);
        $validated = $request->validated();
        $model->fill([
            'room_id' => array_key_exists('roomId', $validated)
                ? $validated['roomId']
                : $model->room_id,
            'title' => $validated['title'] ?? $model->title,
            'title_ar' => array_key_exists('titleAr', $validated)
                ? $validated['titleAr']
                : $model->title_ar,
            'body' => $validated['body'] ?? $model->body,
            'body_ar' => array_key_exists('bodyAr', $validated)
                ? $validated['bodyAr']
                : $model->body_ar,
            'audience' => $validated['audience'] ?? (
                array_key_exists('roomId', $validated) && $validated['roomId']
                    ? 'room'
                    : $model->audience
            ),
            'pinned' => array_key_exists('pinned', $validated)
                ? $request->boolean('pinned')
                : $model->pinned,
            'published_at' => array_key_exists('publishedAt', $validated)
                ? $validated['publishedAt']
                : $model->published_at,
        ])->save();
        $recorder->record(
            'announcement.updated',
            'announcement',
            $model->id,
            $model->organization_id,
            $request->user()->id,
            ['changed' => array_keys($validated)],
            ['announcementId' => $model->id],
            $request,
        );

        return ApiResponse::success($request, $model->fresh());
    }

    public function destroy(
        Request $request,
        string $organization,
        string $announcement,
        OperationRecorder $recorder,
    ): JsonResponse {
        $model = $this->announcement($request, $announcement);
        $model->delete();
        $recorder->record(
            'announcement.deleted',
            'announcement',
            $model->id,
            $model->organization_id,
            $request->user()->id,
            ['title' => $model->title],
            ['announcementId' => $model->id],
            $request,
        );

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

    private function announcement(
        Request $request,
        string $identifier,
    ): Announcement {
        $announcement = Announcement::query()
            ->where('organization_id', $this->organization($request)->id)
            ->where('id', $identifier)
            ->first();

        if (! $announcement) {
            throw new ApiException(
                'RESOURCE_NOT_FOUND',
                'Announcement not found.',
                404,
            );
        }

        return $announcement;
    }
}
