<?php

namespace App\Services\Auth;

class OtpReadinessService
{
    /**
     * Return a safe operational summary without exposing mail credentials.
     *
     * @return array{
     *     status: string,
     *     checks: array<string, bool>,
     *     mailer: string,
     *     queue: string,
     *     sender: string
     * }
     */
    public function report(): array
    {
        $mailer = (string) config('mail.default');
        $sender = (string) config('mail.from.address');
        $checks = [
            'transactionalMail' => ! in_array($mailer, ['log', 'array'], true),
            'senderConfigured' => $this->senderIsConfigured($sender),
            'transportConfigured' => $this->transportIsConfigured($mailer),
            'deliveryMode' => true,
        ];
        $ready = ! in_array(false, $checks, true);

        return [
            'status' => $ready ? 'ready' : 'not_ready',
            'checks' => $checks,
            'mailer' => $mailer,
            'queue' => (string) config('queue.default'),
            'sender' => $this->maskEmail($sender),
        ];
    }

    private function senderIsConfigured(string $sender): bool
    {
        return filter_var($sender, FILTER_VALIDATE_EMAIL) !== false
            && ! str_contains($sender, 'example.com')
            && ! str_ends_with($sender, '.local');
    }

    private function transportIsConfigured(string $mailer): bool
    {
        if ($mailer !== 'smtp') {
            return ! in_array($mailer, ['log', 'array'], true);
        }

        $smtp = config('mail.mailers.smtp', []);
        $host = (string) ($smtp['host'] ?? '');

        return $host !== ''
            && ! in_array($host, ['127.0.0.1', 'localhost'], true)
            && (string) ($smtp['username'] ?? '') !== ''
            && (string) ($smtp['password'] ?? '') !== '';
    }

    private function maskEmail(string $email): string
    {
        if (! str_contains($email, '@')) {
            return '';
        }

        [$local, $domain] = explode('@', $email, 2);
        $visible = mb_substr($local, 0, min(2, mb_strlen($local)));

        return $visible.str_repeat('*', max(3, mb_strlen($local) - 2)).'@'.$domain;
    }
}
