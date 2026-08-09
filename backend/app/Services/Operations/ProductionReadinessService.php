<?php

namespace App\Services\Operations;

class ProductionReadinessService
{
    /**
     * Return production configuration checks without exposing secrets.
     *
     * @return array<string, array{passed:bool,actual:string,expected:string}>
     */
    public function checks(): array
    {
        $origins = array_values(array_filter(config('cors.allowed_origins', [])));

        return [
            'environment' => $this->check(
                app()->environment('production'),
                (string) app()->environment(),
                'production',
            ),
            'debug_disabled' => $this->check(
                ! config('app.debug'),
                config('app.debug') ? 'enabled' : 'disabled',
                'disabled',
            ),
            'application_key' => $this->check(
                is_string(config('app.key')) && config('app.key') !== '',
                config('app.key') ? 'configured' : 'missing',
                'configured',
            ),
            'https_application_url' => $this->httpsCheck(
                (string) config('app.url'),
            ),
            'https_frontend_url' => $this->httpsCheck(
                (string) config('aio.frontend_url'),
            ),
            'secure_refresh_cookie' => $this->check(
                config('aio.cookie_secure') === true,
                config('aio.cookie_secure') ? 'secure' : 'insecure',
                'secure',
            ),
            'refresh_cookie_same_site' => $this->check(
                in_array(config('aio.cookie_same_site'), ['lax', 'strict'], true),
                (string) config('aio.cookie_same_site'),
                'lax or strict',
            ),
            'restricted_cors' => $this->check(
                $origins !== []
                    && ! in_array('*', $origins, true)
                    && collect($origins)->every(
                        fn (string $origin): bool => str_starts_with(
                            $origin,
                            'https://',
                        ),
                    ),
                $origins === [] ? 'empty' : implode(',', $origins),
                'explicit HTTPS origins',
            ),
            'postgresql_database' => $this->check(
                config('database.default') === 'pgsql',
                (string) config('database.default'),
                'pgsql',
            ),
            'redis_cache' => $this->check(
                config('cache.default') === 'redis',
                (string) config('cache.default'),
                'redis',
            ),
            'redis_queue' => $this->check(
                config('queue.default') === 'redis',
                (string) config('queue.default'),
                'redis',
            ),
            'distributed_session' => $this->check(
                in_array(config('session.driver'), ['redis', 'database'], true),
                (string) config('session.driver'),
                'redis or database',
            ),
            'private_object_storage' => $this->check(
                config('filesystems.default') === 's3',
                (string) config('filesystems.default'),
                's3',
            ),
            'transactional_mail' => $this->check(
                ! in_array(config('mail.default'), ['log', 'array'], true),
                (string) config('mail.default'),
                'a transactional mail transport',
            ),
            'transactional_mail_credentials' => $this->check(
                $this->mailCredentialsConfigured(),
                $this->mailCredentialsConfigured() ? 'configured' : 'missing',
                'configured SMTP credentials and sender',
            ),
            'demo_access_disabled' => $this->check(
                config('aio.demo_access.enabled') === false,
                config('aio.demo_access.enabled') ? 'enabled' : 'disabled',
                'disabled',
            ),
            'push_notifications_configured' => $this->check(
                $this->pushNotificationsConfigured(),
                $this->pushNotificationsConfigured() ? 'configured' : (string) config('push.provider'),
                'fcm with service account credentials',
            ),
            'backup_strategy_configured' => $this->check(
                config('backups.enabled') === true
                    && config('backups.disk') === 's3'
                    && (int) config('backups.retention_days') >= 7,
                $this->backupActual(),
                'enabled on s3 with at least 7 days retention',
            ),
            'production_log_level' => $this->check(
                ! in_array($this->logLevel(), ['debug'], true),
                $this->logLevel(),
                'info or stricter',
            ),
            'server_log_stream' => $this->check(
                $this->serverLogStreamConfigured(),
                $this->loggingActual(),
                'stderr/syslog/papertrail or stack including one of them',
            ),
            'redis_health_required' => $this->check(
                config('aio.redis_required') === true,
                config('aio.redis_required') ? 'required' : 'optional',
                'required',
            ),
        ];
    }

    /**
     * @param  array<string, array{passed:bool,actual:string,expected:string}>|null  $checks
     */
    public function passes(?array $checks = null): bool
    {
        return collect($checks ?? $this->checks())
            ->every(fn (array $check): bool => $check['passed']);
    }

    /**
     * @return array{passed:bool,actual:string,expected:string}
     */
    private function check(
        bool $passed,
        string $actual,
        string $expected,
    ): array {
        return compact('passed', 'actual', 'expected');
    }

    /**
     * @return array{passed:bool,actual:string,expected:string}
     */
    private function httpsCheck(string $url): array
    {
        return $this->check(
            str_starts_with($url, 'https://'),
            $url === '' ? 'missing' : $url,
            'an HTTPS URL',
        );
    }

    private function backupActual(): string
    {
        return sprintf(
            '%s/%s/%d days',
            config('backups.enabled') ? 'enabled' : 'disabled',
            (string) config('backups.disk'),
            (int) config('backups.retention_days'),
        );
    }

    private function loggingActual(): string
    {
        $channel = (string) config('logging.default');

        if ($channel !== 'stack') {
            return $channel;
        }

        return 'stack:'.implode(',', $this->stackLogChannels());
    }

    private function logLevel(): string
    {
        $channel = (string) config('logging.default');

        if ($channel === 'stack') {
            foreach ($this->stackLogChannels() as $stackedChannel) {
                $level = config("logging.channels.{$stackedChannel}.level");

                if (is_string($level) && $level !== '') {
                    return mb_strtolower($level);
                }
            }
        }

        return mb_strtolower((string) config(
            "logging.channels.{$channel}.level",
            'debug',
        ));
    }

    private function mailCredentialsConfigured(): bool
    {
        if (config('mail.default') !== 'smtp') {
            return true;
        }

        return collect([
            config('mail.mailers.smtp.host'),
            config('mail.mailers.smtp.username'),
            config('mail.mailers.smtp.password'),
            config('mail.from.address'),
        ])->every(fn (mixed $value): bool => is_string($value) && trim($value) !== '');
    }

    private function pushNotificationsConfigured(): bool
    {
        if (config('push.provider') !== 'fcm') {
            return false;
        }

        $hasServiceAccount = filled(config('push.fcm.service_account_json_base64'))
            || filled(config('push.fcm.service_account_path'));

        return filled(config('push.fcm.project_id')) && $hasServiceAccount;
    }

    private function serverLogStreamConfigured(): bool
    {
        $channels = (string) config('logging.default') === 'stack'
            ? $this->stackLogChannels()
            : [(string) config('logging.default')];

        return collect($channels)
            ->intersect(['stderr', 'syslog', 'papertrail'])
            ->isNotEmpty();
    }

    /**
     * @return list<string>
     */
    private function stackLogChannels(): array
    {
        $channels = config('logging.channels.stack.channels', []);

        if (is_string($channels)) {
            $channels = explode(',', $channels);
        }

        return array_values(array_filter(array_map(
            fn (mixed $channel): string => trim((string) $channel),
            is_array($channels) ? $channels : [],
        )));
    }
}
