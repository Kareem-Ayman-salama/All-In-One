<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Models\ContentAccessLog;
use App\Models\ContentItem;
use App\Models\CourseBatch;
use App\Models\RoomMembership;
use App\Models\VideoWatchProgress;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class VideoProgressController extends Controller
{
    public function saveProgress(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'contentId' => ['required', 'string', 'max:255'],
            'watchedSeconds' => ['required', 'integer', 'min:0'],
            'totalDurationSeconds' => ['required', 'integer', 'min:1'],
            'lastPositionSeconds' => ['required', 'integer', 'min:0'],
        ]);

        // Resolve ContentItem exclusively from persisted database records
        $content = ContentItem::query()->with('room')
            ->where('id', $validated['contentId'])
            ->orWhere('external_video_id', $validated['contentId'])
            ->first();

        if (! $content) {
            throw new ApiException('CONTENT_NOT_FOUND', 'Video content not found.', 404);
        }

        $orgId = $content->organization_id;
        $roomId = $content->room_id;
        $courseId = $content->room?->course_id;

        // Enforce room / tenant authorization
        if (! $user->hasRole('super_admin')) {
            $hasAccess = ($roomId && RoomMembership::query()
                ->where('room_id', $roomId)
                ->where('user_id', $user->id)
                ->where('status', 'active')
                ->exists()) ||
                ($roomId && CourseBatch::query()
                    ->where('room_id', $roomId)
                    ->whereHas('enrollments', function ($q) use ($user): void {
                        $q->where('student_id', $user->id)->where('status', 'active');
                    })->exists()) ||
                $user->organizationMemberships()
                    ->where('organization_id', $orgId)
                    ->whereIn('role_id', function ($query): void {
                        $query->select('id')->from('roles')
                            ->whereIn('name', ['organization_owner', 'organization_admin', 'instructor']);
                    })->exists();

            if (! $hasAccess) {
                throw new ApiException('CONTENT_ACCESS_DENIED', 'You do not have access to this video content.', 403);
            }
        }

        $percentage = (int) min(100, round(($validated['watchedSeconds'] / $validated['totalDurationSeconds']) * 100));
        $isCompleted = $percentage >= 85;

        $progress = VideoWatchProgress::query()->updateOrCreate(
            [
                'student_id' => $user->id,
                'content_id' => $validated['contentId'],
            ],
            [
                'organization_id' => $orgId,
                'room_id' => $roomId,
                'course_id' => $courseId,
                'watched_seconds' => $validated['watchedSeconds'],
                'total_duration_seconds' => $validated['totalDurationSeconds'],
                'last_position_seconds' => $validated['lastPositionSeconds'],
                'completion_percentage' => $percentage,
                'is_completed' => $isCompleted,
                'completed_at' => $isCompleted ? now() : null,
            ]
        );

        // Log security event
        $eventName = $isCompleted ? 'video_completed' : 'video_progress';
        try {
            ContentAccessLog::query()->create([
                'user_id' => $user->id,
                'organization_id' => $orgId,
                'content_id' => $content->id,
                'event' => $eventName,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'metadata' => [
                    'room_id' => $roomId,
                    'course_id' => $courseId,
                    'completion_percentage' => $percentage,
                    'watched_seconds' => $validated['watchedSeconds'],
                    'total_duration' => $validated['totalDurationSeconds'],
                ],
            ]);
        } catch (\Throwable $e) {
            Log::warning('VideoProgress: could not write access log', ['error' => $e->getMessage()]);
        }

        return ApiResponse::success($request, [
            'contentId' => $progress->content_id,
            'lastPositionSeconds' => $progress->last_position_seconds,
            'completionPercentage' => $progress->completion_percentage,
            'isCompleted' => $progress->is_completed,
        ]);
    }

    /**
     * Log a discrete video lifecycle event (start / complete).
     * Called by clients on first play and on reaching completion threshold.
     */
    public function logVideoEvent(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'contentId' => ['required', 'string', 'max:255'],
            'event' => ['required', 'in:video_started,video_completed'],
        ]);

        // Resolve ContentItem exclusively from persisted database records
        $content = ContentItem::query()->with('room')
            ->where('id', $validated['contentId'])
            ->orWhere('external_video_id', $validated['contentId'])
            ->first();

        if (! $content) {
            throw new ApiException('CONTENT_NOT_FOUND', 'Video content not found.', 404);
        }

        $orgId = $content->organization_id;
        $roomId = $content->room_id;
        $courseId = $content->room?->course_id;

        // Enforce room / tenant authorization
        if (! $user->hasRole('super_admin')) {
            $hasAccess = ($roomId && RoomMembership::query()
                ->where('room_id', $roomId)
                ->where('user_id', $user->id)
                ->where('status', 'active')
                ->exists()) ||
                ($roomId && CourseBatch::query()
                    ->where('room_id', $roomId)
                    ->whereHas('enrollments', function ($q) use ($user): void {
                        $q->where('student_id', $user->id)->where('status', 'active');
                    })->exists()) ||
                $user->organizationMemberships()
                    ->where('organization_id', $orgId)
                    ->whereIn('role_id', function ($query): void {
                        $query->select('id')->from('roles')
                            ->whereIn('name', ['organization_owner', 'organization_admin', 'instructor']);
                    })->exists();

            if (! $hasAccess) {
                throw new ApiException('CONTENT_ACCESS_DENIED', 'You do not have access to this video content.', 403);
            }
        }

        try {
            ContentAccessLog::query()->create([
                'user_id' => $user->id,
                'organization_id' => $orgId,
                'content_id' => $content->id,
                'event' => $validated['event'],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'metadata' => [
                    'room_id' => $roomId,
                    'course_id' => $courseId,
                ],
            ]);
        } catch (\Throwable $e) {
            Log::warning('VideoEvent: could not write access log', ['error' => $e->getMessage()]);
        }

        return ApiResponse::success($request, ['logged' => true]);
    }

    public function getProgress(Request $request, string $contentId): JsonResponse
    {
        $user = $request->user();

        $progress = VideoWatchProgress::query()
            ->where('student_id', $user->id)
            ->where('content_id', $contentId)
            ->first();

        if (! $progress) {
            return ApiResponse::success($request, [
                'contentId' => $contentId,
                'lastPositionSeconds' => 0,
                'completionPercentage' => 0,
                'isCompleted' => false,
            ]);
        }

        return ApiResponse::success($request, [
            'contentId' => $progress->content_id,
            'lastPositionSeconds' => $progress->last_position_seconds,
            'completionPercentage' => $progress->completion_percentage,
            'isCompleted' => $progress->is_completed,
            'watchedSeconds' => $progress->watched_seconds,
            'totalDurationSeconds' => $progress->total_duration_seconds,
        ]);
    }
}
