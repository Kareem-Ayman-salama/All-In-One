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
            'mail.default' => 'smtp',
            'logging.channels.single.level' => 'info',
        ]);

        $service = app(ProductionReadinessService::class);

        $this->assertTrue($service->passes(), json_encode(
            $service->checks(),
            JSON_PRETTY_PRINT,
        ));
    }
}
