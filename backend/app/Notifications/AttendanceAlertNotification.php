<?php

namespace App\Notifications;

use App\Models\AttendanceRecord;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AttendanceAlertNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function __construct(
        private readonly AttendanceRecord $record,
        private readonly string $studentName,
    ) {
        $this->afterCommit();
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
        $status = match ($this->record->status) {
            'absent' => 'absent',
            'late' => "late by {$this->record->minutes_late} minutes",
            'excused' => 'absent with an accepted excuse',
            default => $this->record->status,
        };

        return (new MailMessage)
            ->subject('AIO attendance update')
            ->greeting('Hello '.$notifiable->name.',')
            ->line("{$this->studentName} was marked {$status}.")
            ->line(
                $this->record->instructor_note
                    ?: 'Open AIO to review the attendance record.',
            )
            ->action(
                'View attendance',
                rtrim((string) config('aio.frontend_url'), '/').'/guardian/attendance',
            );
    }
}
