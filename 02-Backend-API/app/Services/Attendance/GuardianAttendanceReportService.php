<?php

namespace App\Services\Attendance;

use App\Models\AttendanceRecord;
use App\Models\GuardianStudentLink;
use App\Models\Notification;
use App\Notifications\GuardianWeeklyAttendanceNotification;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Throwable;

class GuardianAttendanceReportService
{
    /**
     * @return array<string, int|float>
     */
    public function summary(
        GuardianStudentLink $link,
        CarbonImmutable $from,
        CarbonImmutable $to,
    ): array {
        $counts = AttendanceRecord::query()
            ->where('organization_id', $link->organization_id)
            ->where('student_id', $link->student_id)
            ->where('guardian_visible', true)
            ->whereBetween('marked_at', [$from, $to])
            ->selectRaw('status, count(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');
        $total = (int) $counts->sum();
        $attended = (int) ($counts['present'] ?? 0)
            + (int) ($counts['late'] ?? 0);

        return [
            'total' => $total,
            'present' => (int) ($counts['present'] ?? 0),
            'absent' => (int) ($counts['absent'] ?? 0),
            'late' => (int) ($counts['late'] ?? 0),
            'excused' => (int) ($counts['excused'] ?? 0),
            'attendanceRate' => $total > 0
                ? round(($attended / $total) * 100, 1)
                : 0,
        ];
    }

    /**
     * @return Collection<int, GuardianStudentLink>
     */
    public function sendForOrganization(
        string $organizationId,
        ?CarbonImmutable $from = null,
        ?CarbonImmutable $to = null,
    ): Collection {
        $to ??= CarbonImmutable::now()->endOfDay();
        $from ??= $to->subDays(6)->startOfDay();

        $links = GuardianStudentLink::query()
            ->with('guardian:id,name,email', 'student:id,name,email')
            ->where('organization_id', $organizationId)
            ->where('status', 'active')
            ->where('weekly_report_enabled', true)
            ->where(function ($query) use ($from): void {
                $query->whereNull('weekly_report_last_sent_at')
                    ->orWhere('weekly_report_last_sent_at', '<', $from);
            })
            ->get();

        return $links->filter(function (GuardianStudentLink $link) use (
            $from,
            $to,
        ): bool {
            $summary = $this->summary($link, $from, $to);
            if ($summary['total'] === 0 || ! $link->guardian || ! $link->student) {
                return false;
            }

            Notification::query()->create([
                'user_id' => $link->guardian_id,
                'organization_id' => $link->organization_id,
                'type' => 'guardian_weekly_attendance',
                'priority' => $summary['absent'] > 0 ? 'high' : 'normal',
                'title' => 'Weekly attendance report',
                'body' => "{$link->student->name}: {$summary['attendanceRate']}% attendance",
                'target_type' => 'guardian_student_link',
                'target_id' => $link->id,
                'data' => [
                    'route' => '/guardian/attendance',
                    'studentId' => $link->student_id,
                    'summary' => $summary,
                    'from' => $from->toDateString(),
                    'to' => $to->toDateString(),
                ],
                'status' => 'unread',
            ]);

            try {
                $link->guardian->notify(new GuardianWeeklyAttendanceNotification(
                    $link->student->name,
                    $summary,
                    $from->toDateString().' - '.$to->toDateString(),
                ));
            } catch (Throwable $exception) {
                report($exception);
            }

            $link->update(['weekly_report_last_sent_at' => now()]);

            return true;
        })->values();
    }
}
