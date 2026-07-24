<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class WorkspaceInvitationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public int $tries = 5;

    /**
     * @var list<int>
     */
    public array $backoff = [30, 120, 600, 1800];

    public function __construct(
        private readonly string $organizationName,
        private readonly string $acceptUrl,
        private readonly string $expiresAt,
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
        return (new MailMessage)
            ->subject("You're invited to {$this->organizationName} on AIO")
            ->greeting('Hello,')
            ->line("You have been invited to join {$this->organizationName}.")
            ->action('Accept invitation', $this->acceptUrl)
            ->line("This invitation expires on {$this->expiresAt}.")
            ->line('If you were not expecting this invitation, you can ignore this email.');
    }
}
