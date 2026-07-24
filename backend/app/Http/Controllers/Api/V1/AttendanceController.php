<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Attendance\CreateLearningSessionRequest;
use App\Http\Requests\Attendance\MarkAttendanceRequest;
use App\Models\AuditLog;
use App\Models\AttendanceRecord;
use App\Models\LearningSession;
use App\Models\Organization;
use App\Services\Attendance\AttendanceService;
use App\Services\Operations\OperationRecorder;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AttendanceController extends Controller
{
    public function sessions(Request $request): JsonResponse
    {
        $items = LearningSession::query()
            ->with([
                'batch:id,course_id,title,title_ar',
                'batch.course:id,title,title_ar',
                'lessonBooking:id,student_id,subject',
                'instructor:id,name,name_ar',
            ])
            ->withCount('attendanceRecords')
            ->where('organization_id', $this->organization($request)->id)
            ->when(
                $request->filled('batchId'),
                fn ($query) => $query->where('batch_id', $request->string('batchId')),
            )
            ->when(
                $request->filled('instructorId'),
                fn ($query) => $query->where('instructor_id', $request->string('instructorId')),
            )
            ->when(
                $request->filled('status'),
                fn ($query) => $query->where('status', $request->string('status')),
            )
            ->when(
                $request->filled('from'),
                fn ($query) => $query->where('starts_at', '>=', $request->date('from')),
            )
            ->when(
                $request->filled('to'),
                fn ($query) => $query->where('starts_at', '<=', $request->date('to')->endOfDay()),
            )
            ->orderByDesc('starts_at')
            ->paginate(min($request->integer('perPage', 50), 100));

        return ApiResponse::success($request, $items->items(), [
            'currentPage' => $items->currentPage(),
            'lastPage' => $items->lastPage(),
            'total' => $items->total(),
        ]);
    }

    public function storeSession(
        CreateLearningSessionRequest $request,
        AttendanceService $service,
        OperationRecorder $recorder,
    ): JsonResponse {
        $organization = $this->organization($request);
        $session = LearningSession::query()->create([
            'organization_id' => $organization->id,
            'batch_id' => $request->validated('batchId'),
            'lesson_booking_id' => $request->validated('lessonBookingId'),
            'instructor_id' => $request->validated('instructorId'),
            'created_by' => $request->user()->id,
            'title' => $request->string('title')->toString(),
            'title_ar' => $request->validated('titleAr'),
            'starts_at' => $request->date('startsAt'),
            'ends_at' => $request->date('endsAt'),
            'notes' => $request->validated('notes'),
            'status' => 'scheduled',
        ]);

        $recorder->record(
            'learning_session.created',
            'learning_session',
            $session->id,
            $organization->id,
            $request->user()->id,
            [],
            ['sessionId' => $session->id],
            $request,
        );

        return ApiResponse::success($request, [
            'session' => $session->load('batch.course', 'lessonBooking', 'instructor'),
            'participantCount' => $service->participants($session)->count(),
        ], status: 201);
    }

    public function attendance(
        Request $request,
        string $organization,
        string $session,
        AttendanceService $service,
    ): JsonResponse {
        $model = $this->session($request, $session);

        return ApiResponse::success($request, [
            'session' => $model->load('batch.course', 'lessonBooking', 'instructor'),
            'participants' => $service->participants($model)->values(),
            'locked' => (bool) $model->attendance_locked_at,
        ]);
    }

    public function mark(
        MarkAttendanceRequest $request,
        string $organization,
        string $session,
        AttendanceService $service,
    ): JsonResponse {
        $records = $service->mark(
            $this->session($request, $session),
            $request->user(),
            $request->validated('records'),
            $request,
        );

        $records->each(
            fn ($record) => $record->load('student:id,name,email'),
        );

        return ApiResponse::success($request, $records);
    }

    public function lock(
        Request $request,
        string $organization,
        string $session,
        OperationRecorder $recorder,
    ): JsonResponse {
        $model = $this->session($request, $session);
        $model->update([
            'attendance_locked_at' => now(),
            'status' => $model->ends_at->isPast() ? 'completed' : $model->status,
        ]);
        $recorder->record(
            'attendance.locked',
            'learning_session',
            $model->id,
            $model->organization_id,
            $request->user()->id,
            [],
            ['sessionId' => $model->id],
            $request,
        );

        return ApiResponse::success($request, $model->fresh());
    }

    public function generateQr(
        Request $request,
        string $organization,
        string $session,
        OperationRecorder $recorder,
    ): JsonResponse {
        $validated = $request->validate([
            'validForMinutes' => ['nullable', 'integer', 'min:2', 'max:30'],
        ]);
        $model = $this->session($request, $session);
        if ($model->attendance_locked_at) {
            throw new ApiException(
                'ATTENDANCE_LOCKED',
                'Attendance for this session is locked.',
                409,
            );
        }

        $token = Str::random(64);
        $expiresAt = now()->addMinutes((int) ($validated['validForMinutes'] ?? 10));
        $model->update([
            'qr_token_hash' => hash('sha256', $token),
            'qr_expires_at' => $expiresAt,
        ]);
        $recorder->record(
            'attendance.qr_generated',
            'learning_session',
            $model->id,
            $model->organization_id,
            $request->user()->id,
            [
                'sessionId' => $model->id,
                'expiresAt' => $expiresAt->toIso8601String(),
            ],
            ['sessionId' => $model->id],
            $request,
        );

        $query = http_build_query([
            'session' => $model->id,
            'token' => $token,
        ]);

        return ApiResponse::success($request, [
            'sessionId' => $model->id,
            'token' => $token,
            'expiresAt' => $expiresAt,
            'checkInUrl' => rtrim((string) config('aio.frontend_url'), '/')
                .'/attendance/check-in?'.$query,
        ]);
    }

    public function checkIn(
        Request $request,
        AttendanceService $service,
    ): JsonResponse {
        $validated = $request->validate([
            'sessionId' => ['required', 'uuid'],
            'token' => ['required', 'string', 'size:64'],
        ]);
        $session = LearningSession::query()->find($validated['sessionId']);
        if (
            ! $session
            || ! $session->qr_token_hash
            || ! hash_equals(
                $session->qr_token_hash,
                hash('sha256', $validated['token']),
            )
            || ! $session->qr_expires_at
            || $session->qr_expires_at->isPast()
        ) {
            throw new ApiException(
                'ATTENDANCE_QR_INVALID',
                'This attendance code is invalid or expired.',
                422,
            );
        }

        $record = $service->mark($session, $request->user(), [[
            'studentId' => $request->user()->id,
            'status' => 'present',
            'guardianVisible' => true,
        ]], $request)->first();
        if (! $record) {
            throw new ApiException(
                'ATTENDANCE_CHECK_IN_FAILED',
                'Attendance could not be recorded.',
                422,
            );
        }

        return ApiResponse::success($request, $record->load(
            'session.batch.course',
            'session.instructor',
        ));
    }

    public function history(
        Request $request,
        string $organization,
        string $session,
    ): JsonResponse {
        $model = $this->session($request, $session);
        $items = AuditLog::query()
            ->with('actor:id,name,email')
            ->where('organization_id', $model->organization_id)
            ->whereIn('action', [
                'attendance.marked',
                'attendance.locked',
                'attendance.qr_generated',
            ])
            ->where('metadata->sessionId', $model->id)
            ->latest('created_at')
            ->limit(100)
            ->get();

        return ApiResponse::success($request, $items);
    }

    public function mine(Request $request): JsonResponse
    {
        $items = AttendanceRecord::query()
            ->with([
                'session.batch.course:id,title,title_ar',
                'session.instructor:id,name,name_ar',
                'markedBy:id,name',
            ])
            ->where('student_id', $request->user()->id)
            ->latest('marked_at')
            ->paginate(min($request->integer('perPage', 50), 100));

        return ApiResponse::success($request, [
            'records' => $items->items(),
            'summary' => $this->summary($request->user()->id),
        ], ['total' => $items->total()]);
    }

    /**
     * @return array<string, int|float>
     */
    private function summary(string $studentId): array
    {
        $counts = AttendanceRecord::query()
            ->where('student_id', $studentId)
            ->selectRaw('status, count(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');
        $total = (int) $counts->sum();
        $attended = (int) ($counts['present'] ?? 0) + (int) ($counts['late'] ?? 0);

        return [
            'total' => $total,
            'present' => (int) ($counts['present'] ?? 0),
            'absent' => (int) ($counts['absent'] ?? 0),
            'late' => (int) ($counts['late'] ?? 0),
            'excused' => (int) ($counts['excused'] ?? 0),
            'attendanceRate' => $total > 0 ? round(($attended / $total) * 100, 1) : 0,
        ];
    }

    private function organization(Request $request): Organization
    {
        return $request->attributes->get('active_organization');
    }

    private function session(Request $request, string $id): LearningSession
    {
        $model = LearningSession::query()
            ->where('organization_id', $this->organization($request)->id)
            ->find($id);
        if (! $model) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Learning session not found.', 404);
        }

        return $model;
    }
}
