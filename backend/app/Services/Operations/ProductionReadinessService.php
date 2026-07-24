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
            'production_log_level' => $this->check(
                ! in_array(
                    mb_strtolower((string) config('logging.channels.single.level')),
                    ['debug'],
                    true,
                ),
                (string) config('logging.channels.single.level'),
                'info or stricter',
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
}
