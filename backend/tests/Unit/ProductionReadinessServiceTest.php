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
            'aio.demo_access.enabled' => false,
            'cors.allowed_origins' => ['https://app.aio.example'],
            'database.default' => 'pgsql',
            'cache.default' => 'redis',
            'queue.default' => 'redis',
            'session.driver' => 'redis',
            'filesystems.default' => 's3',
            'mail.default' => 'smtp',
            'mail.mailers.smtp.host' => 'smtp.example.test',
            'mail.mailers.smtp.username' => 'mailer',
            'mail.mailers.smtp.password' => 'configured',
            'mail.from.address' => 'noreply@aio.example',
            'push.provider' => 'fcm',
            'push.fcm.project_id' => 'aio-example',
            'push.fcm.service_account_json_base64' => base64_encode('{}'),
            'backups.enabled' => true,
            'backups.disk' => 's3',
            'backups.retention_days' => 14,
            'logging.default' => 'stack',
            'logging.channels.stack.channels' => ['stderr'],
            'logging.channels.stderr.level' => 'info',
        ]);

        $service = app(ProductionReadinessService::class);

        $this->assertTrue($service->passes(), json_encode(
            $service->checks(),
            JSON_PRETTY_PRINT,
        ));
    }
}
