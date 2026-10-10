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
            'malware_scanner' => $this->check(
                config('malware_scanner.driver') === 'clamav',
                (string) config('malware_scanner.driver'),
                'clamav',
            ),
            'malware_failure_policy' => $this->check(
                in_array(
                    config('malware_scanner.action_on_threat'),
                    ['quarantine', 'delete'],
                    true,
                ),
                (string) config('malware_scanner.action_on_threat'),
                'quarantine or delete',
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
            'paymob_api_key' => $this->check(
                is_string(config('services.paymob.api_key')) && config('services.paymob.api_key') !== '',
                config('services.paymob.api_key') ? 'configured' : 'missing',
                'configured',
            ),
            'paymob_integration_id' => $this->check(
                is_string(config('services.paymob.integration_id')) && (string) config('services.paymob.integration_id') !== '',
                config('services.paymob.integration_id') ? 'configured' : 'missing',
                'configured',
            ),
            'paymob_hmac_secret' => $this->check(
                is_string(config('services.paymob.hmac_secret')) &&
                config('services.paymob.hmac_secret') !== '' &&
                config('services.paymob.hmac_secret') !== 'test_paymob_hmac_secret',
                (config('services.paymob.hmac_secret') && config('services.paymob.hmac_secret') !== 'test_paymob_hmac_secret') ? 'configured' : 'missing or default',
                'secure non-default hmac secret',
            ),
            'paymob_simulation_disabled' => $this->check(
                ! config('services.paymob.allow_simulation', false),
                config('services.paymob.allow_simulation') ? 'enabled' : 'disabled',
                'disabled',
            ),
            'paymob_sandbox_disabled' => $this->check(
                ! config('services.paymob.sandbox_mode', false),
                config('services.paymob.sandbox_mode') ? 'enabled' : 'disabled',
                'disabled',
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
