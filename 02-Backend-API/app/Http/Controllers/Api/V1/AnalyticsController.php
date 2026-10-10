<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Course;
use App\Models\CourseBatch;
use App\Models\CourseEnrollment;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\OrganizationSubscription;
use App\Models\Room;
use App\Models\StudentSubscription;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    public function organization(Request $request): JsonResponse
    {
        $organization = $request->attributes->get('active_organization');
        $from = $request->date('from') ?? now()->subDays(30)->startOfDay();
        $to = $request->date('to') ?? now()->endOfDay();
        $baseBookings = Booking::query()
            ->where('organization_id', $organization->id)
            ->whereBetween('created_at', [$from, $to]);
        $bookingCount = (clone $baseBookings)->count();
        $confirmedCount = (clone $baseBookings)
            ->where('status', 'confirmed')
            ->count();

        return ApiResponse::success($request, [
            'range' => ['from' => $from, 'to' => $to],
            'metrics' => [
                'rooms' => Room::query()
                    ->where('organization_id', $organization->id)
                    ->count(),
                'members' => OrganizationMembership::query()
                    ->where('organization_id', $organization->id)
                    ->where('status', 'active')
                    ->count(),
                'publishedCourses' => Course::query()
                    ->where('organization_id', $organization->id)
                    ->where('status', 'published')
                    ->count(),
                'activeBatches' => CourseBatch::query()
                    ->where('organization_id', $organization->id)
                    ->whereIn('status', ['open', 'in_progress'])
                    ->count(),
                'bookings' => $bookingCount,
                'confirmedBookings' => $confirmedCount,
                'bookingConversionRate' => $bookingCount > 0
                    ? round(($confirmedCount / $bookingCount) * 100, 2)
                    : 0.0,
                'activeEnrollments' => CourseEnrollment::query()
                    ->where('organization_id', $organization->id)
                    ->where('status', 'active')
                    ->count(),
                'expiringSubscriptions' => StudentSubscription::query()
                    ->where('organization_id', $organization->id)
                    ->where('status', 'active')
                    ->whereBetween('ends_at', [now(), now()->addDays(7)])
                    ->count(),
                'confirmedRevenueMinor' => (int) (clone $baseBookings)
                    ->where('status', 'confirmed')
                    ->where('payment_status', 'paid')
                    ->sum('amount_minor'),
            ],
        ]);
    }

    public function platform(Request $request): JsonResponse
    {
        return ApiResponse::success($request, [
            'metrics' => [
                'organizations' => Organization::query()->count(),
                'activeOrganizations' => Organization::query()
                    ->where('status', 'active')
                    ->count(),
                'memberships' => OrganizationMembership::query()
                    ->where('status', 'active')
                    ->count(),
                'publishedCourses' => Course::query()
                    ->where('status', 'published')
                    ->count(),
                'bookings' => Booking::query()->count(),
                'confirmedBookings' => Booking::query()
                    ->where('status', 'confirmed')
                    ->count(),
                'confirmedRevenueMinor' => (int) Booking::query()
                    ->where('status', 'confirmed')
                    ->where('payment_status', 'paid')
                    ->sum('amount_minor'),
                'expiringOrganizationSubscriptions' => OrganizationSubscription::query()
                    ->whereIn('status', ['active', 'trial'])
                    ->whereBetween('current_period_ends_at', [now(), now()->addDays(7)])
                    ->count(),
                'activeEnrollments' => CourseEnrollment::query()
                    ->where('status', 'active')
                    ->count(),
            ],
        ]);
    }
}
