<?php

namespace App\Console\Commands;

use App\Models\Organization;
use App\Services\Attendance\GuardianAttendanceReportService;
use Illuminate\Console\Command;

class SendWeeklyAttendanceReports extends Command
{
    protected $signature = 'attendance:send-weekly-guardian-reports
                            {--organization= : Send for one organization only}';

    protected $description = 'Send weekly attendance reports to linked guardians';

    public function handle(GuardianAttendanceReportService $service): int
    {
        $query = Organization::query()->where('status', 'active');
        if ($organizationId = $this->option('organization')) {
            $query->whereKey($organizationId);
        }

        $sentCount = 0;
        $query->select('id')->chunkById(100, function ($organizations) use (
            $service,
            &$sentCount,
        ): void {
            foreach ($organizations as $organization) {
                $sentCount += $service->sendForOrganization(
                    $organization->id,
                )->count();
            }
        });

        $this->info("Sent {$sentCount} guardian attendance reports.");

        return self::SUCCESS;
    }
}
