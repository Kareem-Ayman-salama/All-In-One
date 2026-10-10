<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class GuardianAbsenceThresholdNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function __construct(
        private readonly string $studentName,
        private readonly int $absenceCount,
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
            ->subject('AIO absence alert')
            ->greeting('Hello '.$notifiable->name.',')
            ->line(
                "{$this->studentName} has reached {$this->absenceCount} recorded absences.",
            )
            ->line('Please open AIO to review the attendance details.')
            ->action(
                'View attendance',
                rtrim((string) config('aio.frontend_url'), '/').'/guardian/attendance',
            );
    }
}
