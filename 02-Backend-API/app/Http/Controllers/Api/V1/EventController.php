<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Events\StoreEventRequest;
use App\Models\Event;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Services\Operations\OperationRecorder;
use App\Services\Workspace\RoomAccessService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

class EventController extends Controller
{
    public function personalIndex(Request $request): JsonResponse
    {
        $organizationIds = $request->user()->organizationMemberships()
            ->where('status', 'active')
            ->pluck('organization_id');
        $items = Event::query()
            ->where('created_by', $request->user()->id)
            ->where('is_private', true)
            ->whereIn('organization_id', $organizationIds)
            ->orderBy('starts_at')
            ->get();

        return ApiResponse::success($request, $items);
    }

    public function storePersonal(Request $request, OperationRecorder $recorder): JsonResponse
    {
        $organizationIds = $request->user()->organizationMemberships()
            ->where('status', 'active')
            ->pluck('organization_id');
        $validated = $request->validate([
            'organizationId' => ['required', 'uuid', Rule::in($organizationIds->all())],
            'title' => ['required', 'string', 'max:200'],
            'titleAr' => ['nullable', 'string', 'max:200'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'startsAt' => ['required', 'date', 'after:now'],
            'reminderMinutes' => ['required', 'integer', 'min:0', 'max:10080'],
        ]);
        $startsAt = Carbon::parse($validated['startsAt']);
        $event = Event::query()->create([
            'organization_id' => $validated['organizationId'],
            'created_by' => $request->user()->id,
            'title' => $validated['title'],
            'title_ar' => $validated['titleAr'] ?? $validated['title'],
            'description' => $validated['notes'] ?? null,
            'type' => 'personal_reminder',
            'starts_at' => $startsAt,
            'ends_at' => $startsAt->copy()->addMinutes(15),
            'status' => 'scheduled',
            'is_private' => true,
            'reminder_minutes' => $validated['reminderMinutes'],
        ]);
        $recorder->record('reminder.created', 'event', $event->id, $event->organization_id, $request->user()->id, [], [
            'startsAt' => $event->starts_at->toIso8601String(),
            'reminderMinutes' => $event->reminder_minutes,
        ], $request);

        return ApiResponse::success($request, $event, status: 201);
    }

    public function destroyPersonal(Request $request, string $event): JsonResponse
    {
        $deleted = Event::query()
            ->whereKey($event)
            ->where('created_by', $request->user()->id)
            ->where('is_private', true)
            ->firstOrFail();
        $deleted->delete();

        return ApiResponse::success($request, ['deleted' => true]);
    }

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

        $query = Event::query()
            ->where('organization_id', $this->organization($request)->id)
            ->where('is_private', false)
            ->when(
                $request->filled('roomId'),
                fn ($query) => $query->where('room_id', $request->string('roomId')),
            )
            ->when(
                $request->filled('from'),
                fn ($query) => $query->where('ends_at', '>=', $request->date('from')),
            )
            ->when(
                $request->filled('to'),
                fn ($query) => $query->where('starts_at', '<=', $request->date('to')),
            )
            ->orderBy('starts_at');
        $access->scopeVisibleRooms(
            $query,
            $request->user(),
            $this->membership($request),
            includeOrganizationWide: true,
        );
        $items = $query->paginate(min($request->integer('perPage', 50), 100));

        return ApiResponse::success($request, $items->items(), [
            'currentPage' => $items->currentPage(),
            'lastPage' => $items->lastPage(),
            'total' => $items->total(),
        ]);
    }

    public function store(
        StoreEventRequest $request,
        OperationRecorder $recorder,
    ): JsonResponse {
        $organization = $this->organization($request);
        $event = Event::query()->create([
            'organization_id' => $organization->id,
            'room_id' => $request->validated('roomId'),
            'created_by' => $request->user()->id,
            'title' => $request->validated('title'),
            'title_ar' => $request->validated('titleAr'),
            'description' => $request->validated('description'),
            'type' => $request->validated('type', 'event'),
            'starts_at' => $request->validated('startsAt'),
            'ends_at' => $request->validated('endsAt'),
            'location' => $request->validated('location'),
            'meeting_provider' => $request->validated('meetingProvider'),
            'meeting_reference' => $request->validated('meetingReference'),
            'status' => $request->validated('status', 'scheduled'),
        ]);
        $recorder->record(
            'event.created',
            'event',
            $event->id,
            $organization->id,
            $request->user()->id,
            ['roomId' => $event->room_id],
            ['eventId' => $event->id],
            $request,
        );

        return ApiResponse::success($request, $event, status: 201);
    }

    public function destroy(
        Request $request,
        string $organization,
        string $event,
        OperationRecorder $recorder,
    ): JsonResponse {
        $model = Event::query()
            ->where('organization_id', $this->organization($request)->id)
            ->where('id', $event)
            ->first();
        if (! $model) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Event not found.', 404);
        }
        $model->delete();
        $recorder->record(
            'event.deleted',
            'event',
            $model->id,
            $model->organization_id,
            $request->user()->id,
            [],
            ['eventId' => $model->id],
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
}
