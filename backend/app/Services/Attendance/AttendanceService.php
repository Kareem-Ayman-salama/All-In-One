<?php

namespace App\Services\Attendance;

use App\Exceptions\ApiException;
use App\Models\AttendanceRecord;
use App\Models\CourseEnrollment;
use App\Models\GuardianStudentLink;
use App\Models\LearningSession;
use App\Models\Notification;
use App\Models\User;
use App\Notifications\AttendanceAlertNotification;
use App\Services\Operations\OperationRecorder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Throwable;

class AttendanceService
{
    public function __construct(
        private readonly OperationRecorder $recorder,
    ) {}

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function participants(LearningSession $session): Collection
    {
        $records = $session->attendanceRecords()
            ->get()
            ->keyBy('student_id');

        if ($session->batch_id) {
            return CourseEnrollment::query()
                ->with('student:id,name,email')
                ->where('organization_id', $session->organization_id)
                ->where('batch_id', $session->batch_id)
                ->whereIn('status', ['active', 'completed'])
                ->get()
                ->map(fn (CourseEnrollment $enrollment): array => [
                    'student' => $enrollment->student,
                    'enrollmentId' => $enrollment->id,
                    'lessonBookingId' => null,
                    'record' => $records->get($enrollment->student_id),
                ]);
        }

        $booking = $session->lessonBooking()
            ->with('student:id,name,email')
            ->firstOrFail();

        return collect([[
            'student' => $booking->student,
            'enrollmentId' => null,
            'lessonBookingId' => $booking->id,
            'record' => $records->get($booking->student_id),
        ]]);
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     * @return Collection<int, AttendanceRecord>
     */
    public function mark(
        LearningSession $session,
        User $actor,
        array $rows,
        ?Request $request = null,
    ): Collection {
        if ($session->attendance_locked_at) {
            throw new ApiException(
                'ATTENDANCE_LOCKED',
                'Attendance for this session is locked.',
                409,
            );
        }

        $participants = $this->participants($session)
            ->keyBy(fn (array $item): string => $item['student']->id);

        $records = DB::transaction(function () use (
            $session,
            $actor,
            $rows,
            $participants,
            $request,
        ): Collection {
            return collect($rows)->map(function (array $row) use (
                $session,
                $actor,
                $participants,
                $request,
            ): AttendanceRecord {
                $participant = $participants->get($row['studentId']);
                if (! $participant) {
                    throw new ApiException(
                        'ATTENDANCE_STUDENT_NOT_ENROLLED',
                        'The student does not belong to this session.',
                        422,
                    );
                }

                $record = AttendanceRecord::query()->updateOrCreate([
                    'session_id' => $session->id,
                    'student_id' => $row['studentId'],
                ], [
                    'organization_id' => $session->organization_id,
                    'enrollment_id' => $participant['enrollmentId'],
                    'lesson_booking_id' => $participant['lessonBookingId'],
                    'marked_by' => $actor->id,
                    'status' => $row['status'],
                    'minutes_late' => $row['status'] === 'late'
                        ? (int) ($row['minutesLate'] ?? 0)
                        : 0,
                    'excuse_reason' => $row['excuseReason'] ?? null,
                    'instructor_note' => $row['instructorNote'] ?? null,
                    'guardian_visible' => $row['guardianVisible'] ?? true,
                    'marked_at' => now(),
                ]);

                $this->recorder->record(
                    'attendance.marked',
                    'attendance_record',
                    $record->id,
                    $session->organization_id,
                    $actor->id,
                    [
                        'sessionId' => $session->id,
                        'studentId' => $row['studentId'],
                        'status' => $row['status'],
                    ],
                    ['attendanceRecordId' => $record->id],
                    $request,
                );

                return $record;
            });
        });

        $records->each(fn (AttendanceRecord $record) => $this->notify($record));

        return $records;
    }

    private function notify(AttendanceRecord $record): void
    {
        if (
            ! in_array($record->status, ['absent', 'late', 'excused'], true)
            || (! $record->wasRecentlyCreated
                && ! $record->wasChanged(['status', 'minutes_late']))
        ) {
            return;
        }

        $record->load('student:id,name,email');
        $links = GuardianStudentLink::query()
            ->with('guardian:id,name,email')
            ->where('organization_id', $record->organization_id)
            ->where('student_id', $record->student_id)
            ->where('status', 'active')
            ->get();

        $recipients = collect([$record->student]);
        if ($record->guardian_visible) {
            $recipients = $recipients->merge($links->pluck('guardian'));
        }
        $recipients = $recipients->filter()->unique('id');

        foreach ($recipients as $recipient) {
            Notification::query()->updateOrCreate([
                'user_id' => $recipient->id,
                'organization_id' => $record->organization_id,
                'type' => 'attendance_alert',
                'target_type' => 'attendance_record',
                'target_id' => $record->id,
            ], [
                'priority' => $record->status === 'absent' ? 'high' : 'normal',
                'title' => 'Attendance update',
                'body' => "{$record->student->name}: {$record->status}",
                'data' => [
                    'route' => $recipient->id === $record->student_id
                        ? '/end-user/attendance'
                        : '/guardian/attendance',
                    'studentId' => $record->student_id,
                    'status' => $record->status,
                ],
                'status' => 'unread',
            ]);

            if ($recipient->id !== $record->student_id) {
                try {
                    $recipient->notify(new AttendanceAlertNotification(
                        $record,
                        $record->student->name,
                    ));
                } catch (Throwable $exception) {
                    report($exception);
                }
            }
        }
    }
}
