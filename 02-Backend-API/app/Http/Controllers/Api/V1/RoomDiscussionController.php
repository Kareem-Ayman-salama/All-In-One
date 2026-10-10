<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Models\CourseBatch;
use App\Models\Organization;
use App\Models\Room;
use App\Models\RoomDiscussion;
use App\Models\RoomDiscussionComment;
use App\Models\RoomMembership;
use App\Models\User;
use App\Services\Guardians\GuardianConsentService;
use App\Services\Operations\OperationRecorder;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoomDiscussionController extends Controller
{
    public function __construct(
        protected ?GuardianConsentService $guardianConsentService = null,
    ) {
        $this->guardianConsentService = $this->guardianConsentService ?: app(GuardianConsentService::class);
    }

    public function index(Request $request, string $room): JsonResponse
    {
        $user = $request->user();
        $roomModel = Room::query()->findOrFail($room);
        $this->ensureRoomAccess($user, $roomModel);

        $discussions = RoomDiscussion::query()
            ->with(['user:id,name,email,avatar_url', 'comments.user:id,name,email,avatar_url'])
            ->where('room_id', $roomModel->id)
            ->orderByDesc('is_pinned')
            ->orderByDesc('created_at')
            ->paginate(min($request->integer('perPage', 30), 100));

        return ApiResponse::success($request, $discussions->items(), [
            'currentPage' => $discussions->currentPage(),
            'lastPage' => $discussions->lastPage(),
            'total' => $discussions->total(),
        ]);
    }

    public function store(Request $request, string $room, OperationRecorder $recorder): JsonResponse
    {
        $user = $request->user();
        $roomModel = Room::query()->findOrFail($room);
        $this->ensureRoomAccess($user, $roomModel);
        $this->guardianConsentService->assertActionAllowed($user, 'create room discussions', $roomModel->organization_id);

        $validated = $request->validate([
            'title' => ['required', 'string', 'min:3', 'max:200'],
            'body' => ['required', 'string', 'min:5', 'max:5000'],
        ]);

        $discussion = RoomDiscussion::query()->create([
            'organization_id' => $roomModel->organization_id,
            'room_id' => $roomModel->id,
            'user_id' => $user->id,
            'title' => $validated['title'],
            'body' => $validated['body'],
            'is_pinned' => false,
            'is_resolved' => false,
        ]);

        $recorder->record('discussion.created', 'room_discussion', $discussion->id, $roomModel->organization_id, $user->id, [], [
            'roomId' => $roomModel->id,
        ], $request);

        return ApiResponse::success($request, $discussion->load(['user', 'comments']), status: 201);
    }

    public function addComment(Request $request, string $discussion, OperationRecorder $recorder): JsonResponse
    {
        $user = $request->user();
        $disc = RoomDiscussion::query()->with('room')->findOrFail($discussion);
        if ($disc->room) {
            $this->ensureRoomAccess($user, $disc->room);
        }
        $this->guardianConsentService->assertActionAllowed($user, 'post discussion comments', $disc->organization_id);

        $validated = $request->validate([
            'body' => ['required', 'string', 'min:1', 'max:3000'],
        ]);

        // Determine if user is instructor or admin in this room/organization
        $isInstructor = false;
        if ($disc->room) {
            $isInstructor = $disc->room->created_by === $user->id
                || $disc->room->memberships()
                    ->where('user_id', $user->id)
                    ->where('status', 'active')
                    ->whereIn('role', ['instructor', 'admin', 'moderator'])
                    ->exists()
                || $user->hasRole(['instructor', 'organization_owner', 'organization_admin'], $disc->organization_id);
        }

        $comment = RoomDiscussionComment::query()->create([
            'discussion_id' => $disc->id,
            'user_id' => $user->id,
            'body' => $validated['body'],
            'is_instructor_reply' => $isInstructor,
        ]);

        $disc->increment('comments_count');

        $recorder->record('discussion.commented', 'room_discussion_comment', $comment->id, $disc->organization_id, $user->id, [], [
            'discussionId' => $disc->id,
        ], $request);

        return ApiResponse::success($request, $comment->load('user'), status: 201);
    }

    public function togglePin(Request $request, string $discussion): JsonResponse
    {
        $user = $request->user();
        $disc = RoomDiscussion::query()->with('room')->findOrFail($discussion);

        $isAuthorized = $user->hasRole('super_admin') ||
            ($disc->room && (
                $disc->room->created_by === $user->id ||
                $disc->room->memberships()
                    ->where('user_id', $user->id)
                    ->where('status', 'active')
                    ->whereIn('role', ['instructor', 'admin', 'moderator'])
                    ->exists()
            )) ||
            $user->organizationMemberships()
                ->where('organization_id', $disc->organization_id)
                ->whereIn('role_id', function ($query) {
                    $query->select('id')->from('roles')
                        ->whereIn('name', ['organization_owner', 'organization_admin', 'instructor']);
                })
                ->exists();

        if (! $isAuthorized) {
            throw new ApiException('FORBIDDEN', 'Only room instructors or organization administrators can pin discussions.', 403);
        }

        $disc->is_pinned = ! $disc->is_pinned;
        $disc->save();

        return ApiResponse::success($request, [
            'id' => $disc->id,
            'is_pinned' => $disc->is_pinned,
        ]);
    }

    private function ensureRoomAccess(User $user, Room $room): void
    {
        if ($user->hasRole('super_admin')) {
            return;
        }

        // Check if user is organization staff/admin/owner
        $isOrgStaff = $user->organizationMemberships()
            ->where('organization_id', $room->organization_id)
            ->whereIn('role_id', function ($query) {
                $query->select('id')->from('roles')
                    ->whereIn('name', ['organization_owner', 'organization_admin', 'staff', 'instructor']);
            })
            ->exists();

        if ($isOrgStaff) {
            return;
        }

        // Check room creator
        if ($room->created_by === $user->id) {
            return;
        }

        // Check room membership
        $isMember = RoomMembership::query()
            ->where('room_id', $room->id)
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->exists();

        if ($isMember) {
            return;
        }

        // Check enrolled in course batch linked to this room
        $isEnrolledInBatch = CourseBatch::query()
            ->where('room_id', $room->id)
            ->whereHas('enrollments', function ($q) use ($user) {
                $q->where('student_id', $user->id)->where('status', 'active');
            })
            ->exists();

        if ($isEnrolledInBatch) {
            return;
        }

        throw new ApiException('ROOM_ACCESS_DENIED', 'You do not have access to discussions in this room.', 403);
    }
}
