<?php

namespace App\Console\Commands;

use App\Services\Payments\FinancialReconciliationService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class ReconcilePaymentsCommand extends Command
{
    protected $signature = 'payments:reconcile
                            {--from= : Start date for reconciliation window (YYYY-MM-DD)}
                            {--to= : End date for reconciliation window (YYYY-MM-DD)}
                            {--org= : Filter reconciliation by organization UUID}
                            {--auto-fix : Automatically confirm bookings for verified paid payments}
                            {--json : Output raw JSON results}';

    protected $description = 'Reconcile payment transactions, verify ledger integrity, and detect discrepancies.';

    public function handle(FinancialReconciliationService $service): int
    {
        $from = $this->option('from') ? Carbon::parse($this->option('from'))->startOfDay() : null;
        $to = $this->option('to') ? Carbon::parse($this->option('to'))->endOfDay() : null;
        $orgId = $this->option('org') ?: null;
        $autoFix = (bool) $this->option('auto-fix');

        $this->info('Initiating payment and booking financial reconciliation...');

        $report = $service->reconcile(
            from: $from,
            to: $to,
            organizationId: $orgId,
            autoFix: $autoFix,
        );

        if ($this->option('json')) {
            $this->line((string) json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

            return $report['health_status'] === 'critical' ? 1 : 0;
        }

        $this->newLine();
        $this->line('===========================================================');
        $this->line('             FINANCIAL RECONCILIATION REPORT               ');
        $this->line('===========================================================');
        $this->line("Window: {$report['period']['from']} to {$report['period']['to']}");
        if ($orgId) {
            $this->line("Organization: {$orgId}");
        }

        $statusColor = match ($report['health_status']) {
            'healthy' => 'info',
            'warning' => 'comment',
            default => 'error',
        };
        $this->$statusColor('System Health Status: ['.strtoupper((string) $report['health_status']).']');
        $this->newLine();

        $summary = $report['summary'];
        $this->table(
            ['Metric', 'Value'],
            [
                ['Total Payments Recorded', $summary['total_payments_count']],
                ['Paid / Confirmed', $summary['paid_count']],
                ['Pending Payments', $summary['pending_count']],
                ['Failed Payments', $summary['failed_count']],
                ['Fully Refunded', $summary['refunded_count']],
                ['Partially Refunded', $summary['partially_refunded_count']],
                ['Gross Volume (Minor Units)', number_format($summary['gross_volume_minor'])],
                ['Refunded Volume (Minor Units)', number_format($summary['refunded_volume_minor'])],
                ['Estimated Gateway Fees (Minor)', number_format($summary['fee_volume_minor'])],
                ['Estimated Net Payout (Minor)', number_format($summary['net_volume_minor'])],
            ]
        );

        if (! empty($summary['currencies'])) {
            $this->newLine();
            $this->info('Currency Breakdown:');
            $currencyRows = [];
            foreach ($summary['currencies'] as $curr => $data) {
                $currencyRows[] = [
                    $curr,
                    $data['count'],
                    number_format($data['gross_minor']),
                    number_format($data['refunded_minor']),
                    number_format($data['fees_minor']),
                    number_format($data['net_minor']),
                ];
            }
            $this->table(
                ['Currency', 'Count', 'Gross', 'Refunded', 'Fees', 'Net Payout'],
                $currencyRows
            );
        }

        if (! empty($report['discrepancies'])) {
            $this->newLine();
            $this->warn('Discrepancies Detected ('.count($report['discrepancies']).'):');
            $discRows = [];
            foreach ($report['discrepancies'] as $disc) {
                $discRows[] = [
                    $disc['severity'],
                    $disc['type'],
                    $disc['payment_id'] ?? 'N/A',
                    $disc['message'],
                    ! empty($disc['auto_fixed']) ? 'YES' : 'NO',
                ];
            }
            $this->table(
                ['Severity', 'Type', 'Payment ID', 'Message', 'Auto-Fixed'],
                $discRows
            );
        } else {
            $this->newLine();
            $this->info('✓ No financial or booking discrepancies detected.');
        }

        if (! empty($report['fixes_applied'])) {
            $this->newLine();
            $this->info('Automated Fixes Applied:');
            foreach ($report['fixes_applied'] as $fix) {
                $this->line("  - {$fix}");
            }
        }

        $this->newLine();

        return $report['health_status'] === 'critical' ? 1 : 0;
    }
}
