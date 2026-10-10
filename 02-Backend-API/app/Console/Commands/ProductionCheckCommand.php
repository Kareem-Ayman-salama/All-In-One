<?php

namespace App\Console\Commands;

use App\Services\Operations\ProductionReadinessService;
use Illuminate\Console\Command;

class ProductionCheckCommand extends Command
{
    protected $signature = 'aio:production-check {--json : Output JSON}';

    protected $description = 'Fail when required AIO production configuration is unsafe';

    public function handle(ProductionReadinessService $readiness): int
    {
        $checks = $readiness->checks();

        if ($this->option('json')) {
            $this->line(json_encode([
                'ready' => $readiness->passes($checks),
                'checks' => $checks,
            ], JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT));
        } else {
            $this->table(
                ['Check', 'Result', 'Actual', 'Expected'],
                collect($checks)->map(
                    fn (array $check, string $name): array => [
                        $name,
                        $check['passed'] ? 'PASS' : 'FAIL',
                        $check['actual'],
                        $check['expected'],
                    ],
                )->values()->all(),
            );
        }

        return $readiness->passes($checks)
            ? self::SUCCESS
            : self::FAILURE;
    }
}
