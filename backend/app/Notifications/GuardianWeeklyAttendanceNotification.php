<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class GuardianWeeklyAttendanceNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    /**
     * @param  array<string, int|float>  $summary
     */
    public function __construct(
        private readonly string $studentName,
        private readonly array $summary,
        private readonly string $periodLabel,
    ) {
        $this->onConnection('sync')->afterCommit();
    }

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('AIO weekly attendance report')
            ->greeting('Hello '.$notifiable->name.',')
            ->line("Attendance summary for {$this->studentName}: {$this->periodLabel}.")
            ->line("Present: {$this->summary['present']}")
            ->line("Absent: {$this->summary['absent']}")
            ->line("Late: {$this->summary['late']}")
            ->line("Excused: {$this->summary['excused']}")
            ->line("Attendance rate: {$this->summary['attendanceRate']}%")
            ->action(
                'View full report',
                rtrim((string) config('aio.frontend_url'), '/').'/guardian/attendance',
            );
    }
}
