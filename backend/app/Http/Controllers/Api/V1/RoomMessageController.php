<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Rooms\StoreRoomMessageRequest;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\Room;
use App\Models\RoomMessage;
use App\Services\Operations\OperationRecorder;
use App\Services\Workspace\RoomAccessService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoomMessageController extends Controller
{
    public function index(
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

        $messages = RoomMessage::query()
            ->with('user:id,name,email,avatar_path')
            ->where('organization_id', $this->organization($request)->id)
            ->where('room_id', $model->id)
            ->oldest()
            ->paginate(min($request->integer('perPage', 50), 100));

        return ApiResponse::success($request, $messages->items(), [
            'currentPage' => $messages->currentPage(),
            'lastPage' => $messages->lastPage(),
            'total' => $messages->total(),
        ]);
    }

    public function store(
        StoreRoomMessageRequest $request,
        string $organization,
        string $room,
        RoomAccessService $access,
        OperationRecorder $recorder,
    ): JsonResponse {
        $model = $this->room($request, $room);
        $access->ensureCanRead(
            $request->user(),
            $this->membership($request),
            $model->id,
        );

        $message = RoomMessage::query()->create([
            'organization_id' => $this->organization($request)->id,
            'room_id' => $model->id,
            'user_id' => $request->user()->id,
            'body' => $request->validated('body'),
        ]);
        $recorder->record(
            'room_message.created',
            'room_message',
            $message->id,
            $message->organization_id,
            $request->user()->id,
            ['roomId' => $model->id],
            ['roomMessageId' => $message->id],
            $request,
        );

        return ApiResponse::success(
            $request,
            $message->fresh('user:id,name,email,avatar_path'),
            status: 201,
        );
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
}
