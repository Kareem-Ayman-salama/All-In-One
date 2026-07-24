<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class VerificationCodeNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public int $tries = 5;

    /**
     * @var list<int>
     */
    public array $backoff = [30, 120, 600, 1800];

    public function __construct(
        private readonly string $code,
        private readonly string $purpose,
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
        $title = match ($this->purpose) {
            'password_reset' => 'AIO password reset code',
            'mfa_login' => 'AIO administrator sign-in code',
            default => 'Verify your AIO email',
        };

        return (new MailMessage)
            ->subject($title)
            ->greeting('Hello '.$notifiable->name.',')
            ->line('Your six-digit AIO verification code is:')
            ->line($this->code)
            ->line('This code expires in 15 minutes. Do not share it with anyone.');
    }
}
