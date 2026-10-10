<?php

namespace App\Services\Analytics;

use App\Domain\Marketplace\Enums\CourseStatus;
use App\Models\AcademyProfile;
use App\Models\Booking;
use App\Models\Course;
use App\Models\CourseBatch;
use App\Models\GuardianConsent;
use App\Models\Organization;
use App\Models\OrganizationSubscription;
use App\Models\Payment;
use App\Models\User;
use Carbon\Carbon;

class ProductAnalyticsService
{
    /**
     * Compute commercial activation, funnel, and retention scorecard.
     *
     * @return array<string, mixed>
     */
    public function getScorecard(?Carbon $from = null, ?Carbon $to = null): array
    {
        $from = $from ?: now()->subDays(30)->startOfDay();
        $to = $to ?: now()->endOfDay();

        // 1. Academy Counts
        $totalAcademies = Organization::query()->count();
        $activeAcademies = Organization::query()->where('status', 'active')->count();

        $subscriptions = OrganizationSubscription::query()->get();
        $paidSubscribers = $subscriptions->where('status', 'active')->count();
        $trialSubscribers = $subscriptions->where('status', 'trial')->count();

        // 2. Activation Funnel
        $academiesWithProfile = AcademyProfile::query()->distinct('organization_id')->count('organization_id');
        $academiesWithCourse = Course::query()->where('status', CourseStatus::Published)->distinct('organization_id')->count('organization_id');
        $academiesWithBatch = CourseBatch::query()->distinct('organization_id')->count('organization_id');
        $academiesWithStudent = Booking::query()->distinct('organization_id')->count('organization_id');
        $academiesWithRevenue = Payment::query()->where('status', 'paid')->distinct('organization_id')->count('organization_id');

        $profileRate = $totalAcademies > 0 ? round(($academiesWithProfile / $totalAcademies) * 100, 1) : 0.0;
        $courseRate = $totalAcademies > 0 ? round(($academiesWithCourse / $totalAcademies) * 100, 1) : 0.0;
        $revenueRate = $totalAcademies > 0 ? round(($academiesWithRevenue / $totalAcademies) * 100, 1) : 0.0;

        // 3. User & Student Metrics
        $totalUsers = User::query()->count();
        $minorStudents = User::query()->where('is_minor', true)->count();
        $approvedConsents = GuardianConsent::query()->where('status', 'approved')->count();
        $consentRate = $minorStudents > 0 ? round(($approvedConsents / $minorStudents) * 100, 1) : 0.0;

        // 4. Financial & GMV
        $paidPayments = Payment::query()->where('status', 'paid')->whereBetween('created_at', [$from, $to])->get();
        $gmvMinor = (int) $paidPayments->sum('amount_minor');
        $netMinor = (int) $paidPayments->sum('net_minor');
        $txnVolume = $paidPayments->count();

        // 5. 7-Day & 30-Day Activity
        $activeLast7Days = Organization::query()
            ->whereHas('bookings', fn ($q) => $q->where('created_at', '>=', now()->subDays(7)))
            ->count();
        $retention7Day = $totalAcademies > 0 ? round(($activeLast7Days / $totalAcademies) * 100, 1) : 0.0;

        return [
            'period' => [
                'from' => $from->toIso8601String(),
                'to' => $to->toIso8601String(),
            ],
            'academies' => [
                'total' => $totalAcademies,
                'active' => $activeAcademies,
                'paid_subscriptions' => $paidSubscribers,
                'trial_subscriptions' => $trialSubscribers,
            ],
            'activation_funnel' => [
                ['step' => '1. Registered Academy', 'count' => $totalAcademies, 'rate' => 100.0],
                ['step' => '2. Profile Configured', 'count' => $academiesWithProfile, 'rate' => $profileRate],
                ['step' => '3. First Course Published', 'count' => $academiesWithCourse, 'rate' => $courseRate],
                ['step' => '4. Batch Scheduled', 'count' => $academiesWithBatch, 'rate' => $totalAcademies > 0 ? round(($academiesWithBatch / $totalAcademies) * 100, 1) : 0.0],
                ['step' => '5. First Student Enrolled', 'count' => $academiesWithStudent, 'rate' => $totalAcademies > 0 ? round(($academiesWithStudent / $totalAcademies) * 100, 1) : 0.0],
                ['step' => '6. First Payment Collected', 'count' => $academiesWithRevenue, 'rate' => $revenueRate],
            ],
            'minor_safety' => [
                'minor_students_count' => $minorStudents,
                'approved_consents_count' => $approvedConsents,
                'guardian_approval_rate_percent' => $consentRate,
            ],
            'revenue_gmv' => [
                'period_transactions_count' => $txnVolume,
                'gross_volume_minor' => $gmvMinor,
                'gross_volume_egp' => round($gmvMinor / 100, 2),
                'net_volume_minor' => $netMinor,
                'net_volume_egp' => round($netMinor / 100, 2),
            ],
            'retention' => [
                'active_7d_academies' => $activeLast7Days,
                'retention_7d_rate_percent' => $retention7Day,
            ],
        ];
    }
}
