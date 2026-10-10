<?php

namespace Tests\Unit;

use App\Services\Operations\ProductionReadinessService;
use Tests\TestCase;

class ProductionReadinessServiceTest extends TestCase
{
    public function test_local_configuration_is_not_reported_as_production_ready(): void
    {
        $service = app(ProductionReadinessService::class);

        $this->assertFalse($service->passes());
    }

    public function test_secure_distributed_configuration_passes_the_preflight(): void
    {
        $this->app->instance('env', 'production');
        config([
            'app.debug' => false,
            'app.key' => 'base64:'.base64_encode(random_bytes(32)),
            'app.url' => 'https://api.aio.example',
            'aio.frontend_url' => 'https://app.aio.example',
            'aio.cookie_secure' => true,
            'aio.cookie_same_site' => 'lax',
            'aio.redis_required' => true,
            'cors.allowed_origins' => ['https://app.aio.example'],
            'database.default' => 'pgsql',
            'cache.default' => 'redis',
            'queue.default' => 'redis',
            'session.driver' => 'redis',
            'filesystems.default' => 's3',
            'malware_scanner.driver' => 'clamav',
            'malware_scanner.action_on_threat' => 'quarantine',
            'mail.default' => 'smtp',
            'logging.channels.single.level' => 'info',
            'services.paymob.api_key' => 'prod_paymob_api_key_valid_123',
            'services.paymob.integration_id' => '123456',
            'services.paymob.hmac_secret' => 'super_secret_production_hmac_key_987',
            'services.paymob.allow_simulation' => false,
            'services.paymob.sandbox_mode' => false,
        ]);

        $service = app(ProductionReadinessService::class);

        $this->assertTrue($service->passes(), json_encode(
            $service->checks(),
            JSON_PRETTY_PRINT,
        ));
    }

    public function test_non_clamav_driver_fails_the_production_preflight(): void
    {
        config(['malware_scanner.driver' => 'heuristic']);

        $check = app(ProductionReadinessService::class)->checks()['malware_scanner'];

        $this->assertFalse($check['passed']);
        $this->assertSame('heuristic', $check['actual']);
    }
}
