<?php

namespace App\Console\Commands;

use App\Services\Analytics\ProductAnalyticsService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class ShowProductAnalyticsCommand extends Command
{
    protected $signature = 'analytics:funnel-report
                            {--from= : Start date (YYYY-MM-DD)}
                            {--to= : End date (YYYY-MM-DD)}
                            {--json : Output raw JSON results}';

    protected $description = 'Display commercial activation funnel, customer retention, and GMV scorecard.';

    public function handle(ProductAnalyticsService $analytics): int
    {
        $from = $this->option('from') ? Carbon::parse($this->option('from'))->startOfDay() : null;
        $to = $this->option('to') ? Carbon::parse($this->option('to'))->endOfDay() : null;

        $report = $analytics->getScorecard($from, $to);

        if ($this->option('json')) {
            $this->line((string) json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

            return 0;
        }

        $this->newLine();
        $this->line('===========================================================');
        $this->line('       AIN PLATFORM — COMMERCIAL ACTIVATION SCORECARD      ');
        $this->line('===========================================================');
        $this->line("Window: {$report['period']['from']} to {$report['period']['to']}");
        $this->newLine();

        // 1. Academy Overview
        $this->info('1. ACADEMY TENANTS OVERVIEW');
        $academies = $report['academies'];
        $this->table(
            ['Metric', 'Value'],
            [
                ['Total Registered Academies', $academies['total']],
                ['Active Status Academies', $academies['active']],
                ['Paid Plan Subscriptions', $academies['paid_subscriptions']],
                ['Trial Subscriptions', $academies['trial_subscriptions']],
            ]
        );

        // 2. Activation Funnel
        $this->newLine();
        $this->info('2. ONBOARDING & ACTIVATION FUNNEL');
        $funnelRows = [];
        foreach ($report['activation_funnel'] as $step) {
            $funnelRows[] = [
                $step['step'],
                $step['count'],
                "{$step['rate']}%",
            ];
        }
        $this->table(['Funnel Stage', 'Academies', 'Conversion Rate'], $funnelRows);

        // 3. Financial GMV
        $this->newLine();
        $this->info('3. GROSS MERCHANDISE VALUE (GMV)');
        $rev = $report['revenue_gmv'];
        $this->table(
            ['Metric', 'Value'],
            [
                ['Completed Transactions', $rev['period_transactions_count']],
                ['Gross Processed (EGP)', number_format($rev['gross_volume_egp'], 2).' EGP'],
                ['Net Revenue After Fees (EGP)', number_format($rev['net_volume_egp'], 2).' EGP'],
            ]
        );

        // 4. Minor Protection & Safety
        $this->newLine();
        $this->info('4. GUARDIAN CONSENT & MINOR SAFETY');
        $safety = $report['minor_safety'];
        $this->table(
            ['Safety Metric', 'Value'],
            [
                ['Minor Students Enrolled', $safety['minor_students_count']],
                ['Approved Guardian Consents', $safety['approved_consents_count']],
                ['Consent Approval Rate', "{$safety['guardian_approval_rate_percent']}%"],
            ]
        );

        // 5. Retention
        $this->newLine();
        $this->info('5. RETENTION & ENGAGEMENT');
        $ret = $report['retention'];
        $this->table(
            ['Retention Metric', 'Value'],
            [
                ['Active Academies in Last 7 Days', $ret['active_7d_academies']],
                ['7-Day Active Retention Rate', "{$ret['retention_7d_rate_percent']}%"],
            ]
        );

        $this->newLine();

        return 0;
    }
}
