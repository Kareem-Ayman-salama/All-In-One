<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Rooms\StoreRoomRequest;
use App\Http\Requests\Rooms\UpdateRoomRequest;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\Room;
use App\Services\Operations\OperationRecorder;
use App\Services\Plans\EntitlementService;
use App\Services\Workspace\RoomAccessService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RoomController extends Controller
{
    public function index(
        Request $request,
        RoomAccessService $access,
    ): JsonResponse {
        $organization = $this->organization($request);
        $query = Room::query()
            ->withCount('memberships')
            ->where('organization_id', $organization->id)
            ->latest();
        $access->scopeVisibleRooms(
            $query,
            $request->user(),
            $this->membership($request),
            'id',
        );
        $rooms = $query->paginate(min($request->integer('perPage', 20), 100));

        return ApiResponse::success($request, $rooms->items(), [
            'currentPage' => $rooms->currentPage(),
            'lastPage' => $rooms->lastPage(),
            'perPage' => $rooms->perPage(),
            'total' => $rooms->total(),
        ]);
    }

    public function store(
        StoreRoomRequest $request,
        OperationRecorder $recorder,
        EntitlementService $entitlements,
    ): JsonResponse {
        $organization = $this->organization($request);
        $room = DB::transaction(function () use (
            $request,
            $organization,
            $recorder,
            $entitlements,
        ): Room {
            Organization::query()->whereKey($organization->id)->lockForUpdate()->firstOrFail();
            $entitlements->assertCurrentCount(
                $organization,
                'rooms',
                Room::query()
                    ->where('organization_id', $organization->id)
                    ->count(),
            );
            $room = Room::query()->create([
                'organization_id' => $organization->id,
                'created_by' => $request->user()->id,
                'name' => $request->string('name')->toString(),
                'slug' => $this->uniqueSlug(
                    $organization,
                    $request->string('name')->toString(),
                ),
                'description' => $request->validated('description'),
                'access_type' => $request->validated('accessType', 'read_only'),
                'status' => $request->validated('status', 'active'),
                'settings' => [],
            ]);
            $recorder->record(
                'room.created',
                'room',
                $room->id,
                $organization->id,
                $request->user()->id,
                ['name' => $room->name],
                ['roomId' => $room->id],
                $request,
            );

            return $room;
        }, attempts: 3);

        return ApiResponse::success($request, $room, status: 201);
    }

    public function show(
        Request $request,
        string $organization,
        string $room,
        RoomAccessService $access,
    ): JsonResponse {
        $model = $this->room($request, $room);
        $access->ensureCanRead(
            $request->user(),
            $this->membership($request),
            $model->id,
        );

        return ApiResponse::success($request, $model->loadCount('memberships'));
    }

    public function update(
        UpdateRoomRequest $request,
        string $organization,
        string $room,
        OperationRecorder $recorder,
    ): JsonResponse {
        $model = $this->room($request, $room);
        $validated = $request->validated();
        $model->fill([
            'name' => $validated['name'] ?? $model->name,
            'description' => array_key_exists('description', $validated)
                ? $validated['description']
                : $model->description,
            'access_type' => $validated['accessType'] ?? $model->access_type,
            'status' => $validated['status'] ?? $model->status,
        ])->save();
        $recorder->record(
            'room.updated',
            'room',
            $model->id,
            $model->organization_id,
            $request->user()->id,
            ['changed' => array_keys($validated)],
            ['roomId' => $model->id],
            $request,
        );

        return ApiResponse::success($request, $model->fresh());
    }

    public function destroy(
        Request $request,
        string $organization,
        string $room,
        OperationRecorder $recorder,
    ): JsonResponse {
        $model = $this->room($request, $room);

        if ($model->memberships()->exists()) {
            throw new ApiException(
                'ROOM_HAS_MEMBERS',
                'Remove active room members before deleting this room.',
                409,
            );
        }

        $model->delete();
        $recorder->record(
            'room.deleted',
            'room',
            $model->id,
            $model->organization_id,
            $request->user()->id,
            ['name' => $model->name],
            ['roomId' => $model->id],
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

    private function room(Request $request, string $identifier): Room
    {
        $organization = $this->organization($request);
        $room = Room::query()
            ->where('organization_id', $organization->id)
            ->where(fn ($query) => $query
                ->where('id', $identifier)
                ->orWhere('slug', $identifier))
            ->first();

        if (! $room) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Room not found.', 404);
        }

        return $room;
    }

    private function uniqueSlug(Organization $organization, string $name): string
    {
        $base = Str::slug($name) ?: 'room';
        $slug = $base;
        $suffix = 2;

        while (Room::withTrashed()
            ->where('organization_id', $organization->id)
            ->where('slug', $slug)
            ->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
