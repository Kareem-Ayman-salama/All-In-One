<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Rooms\StoreRoomMembershipRequest;
use App\Http\Requests\Rooms\UpdateRoomMembershipRequest;
use App\Models\Organization;
use App\Models\Room;
use App\Models\RoomMembership;
use App\Services\Operations\OperationRecorder;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoomMembershipController extends Controller
{
    public function index(
        Request $request,
        string $organization,
        string $room,
    ): JsonResponse {
        $model = $this->room($request, $room);
        $items = RoomMembership::query()
            ->with('user:id,name,email,avatar_path,status')
            ->where('organization_id', $this->organization($request)->id)
            ->where('room_id', $model->id)
            ->when(
                $request->filled('status'),
                fn ($query) => $query->where(
                    'status',
                    $request->string('status'),
                ),
            )
            ->latest()
            ->paginate(min($request->integer('perPage', 50), 100));

        return ApiResponse::success($request, $items->items(), [
            'currentPage' => $items->currentPage(),
            'lastPage' => $items->lastPage(),
            'total' => $items->total(),
        ]);
    }

    public function store(
        StoreRoomMembershipRequest $request,
        string $organization,
        string $room,
        OperationRecorder $recorder,
    ): JsonResponse {
        $model = $this->room($request, $room);
        $membership = RoomMembership::query()->updateOrCreate([
            'room_id' => $model->id,
            'user_id' => $request->validated('userId'),
        ], [
            'organization_id' => $model->organization_id,
            'role' => $request->validated('role', 'member'),
            'status' => 'active',
            'joined_at' => now(),
        ]);
        $recorder->record(
            'room_member.added',
            'room_membership',
            $membership->id,
            $model->organization_id,
            $request->user()->id,
            ['roomId' => $model->id, 'userId' => $membership->user_id],
            ['roomMembershipId' => $membership->id],
            $request,
        );

        return ApiResponse::success(
            $request,
            $membership->fresh('user'),
            status: 201,
        );
    }

    public function update(
        UpdateRoomMembershipRequest $request,
        string $organization,
        string $room,
        string $roomMembership,
        OperationRecorder $recorder,
    ): JsonResponse {
        $model = $this->roomMembership($request, $room, $roomMembership);
        $validated = $request->validated();
        $model->fill([
            'role' => $validated['role'] ?? $model->role,
            'status' => $validated['status'] ?? $model->status,
        ])->save();
        $recorder->record(
            'room_member.updated',
            'room_membership',
            $model->id,
            $model->organization_id,
            $request->user()->id,
            ['changed' => array_keys($validated)],
            ['roomMembershipId' => $model->id],
            $request,
        );

        return ApiResponse::success($request, $model->fresh('user'));
    }

    public function destroy(
        Request $request,
        string $organization,
        string $room,
        string $roomMembership,
        OperationRecorder $recorder,
    ): JsonResponse {
        $model = $this->roomMembership($request, $room, $roomMembership);
        $model->delete();
        $recorder->record(
            'room_member.removed',
            'room_membership',
            $model->id,
            $model->organization_id,
            $request->user()->id,
            ['roomId' => $model->room_id, 'userId' => $model->user_id],
            ['roomMembershipId' => $model->id],
            $request,
        );

        return ApiResponse::success($request, ['deleted' => true]);
    }

    private function organization(Request $request): Organization
    {
        return $request->attributes->get('active_organization');
    }

    private function room(Request $request, string $identifier): Room
    {
        $room = Room::query()
            ->where('organization_id', $this->organization($request)->id)
            ->where(fn ($query) => $query
                ->where('id', $identifier)
                ->orWhere('slug', $identifier))
            ->first();

        if (! $room) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Room not found.', 404);
        }

        return $room;
    }

    private function roomMembership(
        Request $request,
        string $room,
        string $identifier,
    ): RoomMembership {
        $model = RoomMembership::query()
            ->where('organization_id', $this->organization($request)->id)
            ->where('room_id', $this->room($request, $room)->id)
            ->where('id', $identifier)
            ->first();

        if (! $model) {
            throw new ApiException(
                'RESOURCE_NOT_FOUND',
                'Room membership not found.',
                404,
            );
        }

        return $model;
    }
}
