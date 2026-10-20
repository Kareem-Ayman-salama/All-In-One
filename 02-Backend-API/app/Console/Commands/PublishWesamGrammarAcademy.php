<?php

namespace App\Console\Commands;

use App\Services\Provisioning\WesamGrammarAcademyPublisher;
use Illuminate\Console\Command;

class PublishWesamGrammarAcademy extends Command
{
    protected $signature = 'ain:publish-wesam-academy';

    protected $description = 'Publish the Wesam academy as a free recorded course with open enrollment.';

    public function handle(WesamGrammarAcademyPublisher $publisher): int
    {
        $result = $publisher->publish();

        $this->info('Wesam Grammar Academy is public and open for free enrollment.');
        $this->table(['Field', 'Value'], collect($result)->map(
            fn ($value, $key): array => [
                $key,
                is_bool($value) ? ($value ? 'yes' : 'no') : (string) $value,
            ],
        )->values()->all());

        return self::SUCCESS;
    }
}
