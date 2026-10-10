<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Models\Instructor;
use App\Models\LearningSession;
use App\Models\Organization;
use App\Services\Operations\OperationRecorder;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LiveMeetingController extends Controller
{
    public function schedule(Request $request, OperationRecorder $recorder): JsonResponse
    {
        $org = $this->organization($request);
        $user = $request->user();

        $validated = $request->validate([
            'title' => ['required', 'string', 'min:3', 'max:255'],
            'titleAr' => ['nullable', 'string', 'max:255'],
            'batchId' => [
                'nullable',
                'uuid',
                Rule::exists('course_batches', 'id')->where('organization_id', $org->id),
            ],
            'instructorId' => ['nullable', 'uuid'],
            'startsAt' => ['required', 'date'],
            'endsAt' => ['required', 'date', 'after:startsAt'],
            'meetingProvider' => ['required', 'string', 'in:zoom,google_meet,custom'],
            'meetingLink' => ['required', 'url', 'max:1000'],
            'meetingId' => ['nullable', 'string', 'max:100'],
            'meetingPasscode' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $meetingId = $validated['meetingId'] ?? null;
        $passcode = $validated['meetingPasscode'] ?? null;
        $link = $validated['meetingLink'];

        // Resolve Instructor model belonging to this organization
        $instructorId = null;
        if (! empty($validated['instructorId'])) {
            $instructor = Instructor::query()
                ->where('organization_id', $org->id)
                ->where('id', $validated['instructorId'])
                ->first();
            if (! $instructor) {
                throw new ApiException('INVALID_INSTRUCTOR', 'The specified instructor was not found in this organization.', 422);
            }
            $instructorId = $instructor->id;
        } else {
            $instructor = Instructor::query()
                ->where('organization_id', $org->id)
                ->where('user_id', $user->id)
                ->first();
            $instructorId = $instructor?->id;
        }

        $session = LearningSession::query()->create([
            'organization_id' => $org->id,
            'batch_id' => $validated['batchId'] ?? null,
            'instructor_id' => $instructorId,
            'created_by' => $user->id,
            'title' => $validated['title'],
            'title_ar' => $validated['titleAr'] ?? $validated['title'],
            'starts_at' => $validated['startsAt'],
            'ends_at' => $validated['endsAt'],
            'status' => 'scheduled',
            'notes' => $validated['notes'] ?? null,
            'meeting_provider' => $validated['meetingProvider'],
            'meeting_link' => $link,
            'meeting_id' => $meetingId,
            'meeting_passcode' => $passcode,
        ]);

        $recorder->record('meeting.scheduled', 'learning_session', $session->id, $org->id, $user->id, [], [
            'meetingProvider' => $validated['meetingProvider'],
            'startsAt' => $session->starts_at->toIso8601String(),
        ], $request);

        return ApiResponse::success($request, $session, status: 201);
    }

    public function upcoming(Request $request): JsonResponse
    {
        $user = $request->user();
        $isOrgAdmin = $request->attributes->has('active_organization');

        $query = LearningSession::query()
            ->with(['batch:id,name,course_id', 'batch.course:id,title,title_ar'])
            ->withCount('attendanceRecords')
            ->whereNotNull('meeting_link')
            ->where('ends_at', '>=', $request->string('scope')->toString() === 'all'
                ? now()->subDays(90)
                : now()->subHours(2));

        if ($isOrgAdmin) {
            $org = $this->organization($request);
            $query->where('organization_id', $org->id);
        } elseif (! $user->hasRole('super_admin')) {
            $userOrgIds = $user->organizationMemberships()->pluck('organization_id');
            $userInstructorIds = Instructor::query()
                ->where('user_id', $user->id)
                ->pluck('id');

            $query->whereIn('organization_id', $userOrgIds)
                ->where(function ($sub) use ($user, $userInstructorIds): void {
                    $sub->whereIn('instructor_id', $userInstructorIds)
                        ->orWhere('created_by', $user->id)
                        ->orWhereHas('batch.enrollments', function ($enrollmentQuery) use ($user): void {
                            $enrollmentQuery->where('student_id', $user->id)
                                ->where('status', 'active');
                        });
                });
        }

        if (! $isOrgAdmin && ! $user->hasRole('super_admin')) {
            $query->with(['attendanceRecords' => function ($attendanceQuery) use ($user): void {
                $attendanceQuery->where('student_id', $user->id)->select([
                    'id',
                    'session_id',
                    'student_id',
                    'status',
                    'marked_at',
                ]);
            }]);
        }

        $items = $query->orderByDesc('starts_at')->take(50)->get()->map(function (LearningSession $session): LearningSession {
            $attendance = $session->relationLoaded('attendanceRecords')
                ? $session->attendanceRecords->first()
                : null;
            $session->setAttribute('attendanceStatus', $attendance?->status);
            $session->setAttribute('attendanceCount', $session->attendance_records_count);
            $session->unsetRelation('attendanceRecords');

            return $session;
        });

        return ApiResponse::success($request, $items);
    }

    private function organization(Request $request): Organization
    {
        $org = $request->attributes->get('active_organization');
        if (! $org && $request->route('organization')) {
            $orgParam = $request->route('organization');
            $org = $orgParam instanceof Organization ? $orgParam : Organization::query()->where('id', $orgParam)->orWhere('slug', $orgParam)->first();
        }
        if (! $org && $request->header('X-Organization-Id')) {
            $org = Organization::query()->find($request->header('X-Organization-Id'));
        }
        if (! $org) {
            throw new ApiException('UNAUTHORIZED', 'Organization context required.', 403);
        }

        // Verify caller membership in the resolved organization (unless platform super_admin)
        $user = $request->user();
        if ($user && ! $user->hasRole('super_admin')) {
            $hasMembership = $user->organizationMemberships()
                ->where('organization_id', $org->id)
                ->where('status', 'active')
                ->exists();

            if (! $hasMembership) {
                throw new ApiException('TENANT_ACCESS_DENIED', 'You do not have access to this organization.', 403);
            }
        }

        return $org;
    }
}
