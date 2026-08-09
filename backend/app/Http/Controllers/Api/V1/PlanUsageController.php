<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ContentItem;
use App\Models\Course;
use App\Models\FileAsset;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\Room;
use App\Models\WorkspaceInvitation;
use App\Services\Plans\EntitlementService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlanUsageController extends Controller
{
    public function show(
        Request $request,
        string $organization,
        EntitlementService $entitlements,
    ): JsonResponse {
        /** @var Organization $activeOrganization */
        $activeOrganization = $request->attributes->get('active_organization');
        $subscription = $entitlements->activeSubscription($activeOrganization);
        $modules = $subscription?->plan?->modules?->keyBy('module') ?? collect();
        $metrics = [
            'rooms' => Room::query()
                ->where('organization_id', $activeOrganization->id)
                ->count(),
            'members' => OrganizationMembership::query()
                ->where('organization_id', $activeOrganization->id)
                ->where('status', 'active')
                ->count(),
            'pending_members' => WorkspaceInvitation::query()
                ->where('organization_id', $activeOrganization->id)
                ->where('status', 'pending')
                ->where('expires_at', '>', now())
                ->count(),
            'admins' => OrganizationMembership::query()
                ->where('organization_id', $activeOrganization->id)
                ->where('status', 'active')
                ->whereHas('role', fn ($query) => $query->whereIn('name', [
                    'organization_owner',
                    'organization_admin',
                ]))
                ->count(),
            'courses' => Course::query()
                ->where('organization_id', $activeOrganization->id)
                ->count(),
            'content' => ContentItem::query()
                ->where('organization_id', $activeOrganization->id)
                ->count(),
            'videos' => ContentItem::query()
                ->where('organization_id', $activeOrganization->id)
                ->whereIn('type', ['video', 'youtube'])
                ->count(),
            'storage_bytes' => (int) FileAsset::query()
                ->where('organization_id', $activeOrganization->id)
                ->whereIn('status', ['pending', 'processing', 'ready'])
                ->sum('size_bytes'),
        ];

        return ApiResponse::success($request, [
            'subscription' => $subscription ? [
                'id' => $subscription->id,
                'status' => $subscription->status,
                'billingInterval' => $subscription->billing_interval,
                'trialEndsAt' => $subscription->trial_ends_at,
                'currentPeriodEndsAt' => $subscription->current_period_ends_at,
                'daysRemaining' => now()->diffInDays(
                    $subscription->trial_ends_at
                        ?: $subscription->current_period_ends_at,
                    false,
                ),
                'plan' => [
                    'code' => $subscription->plan->code,
                    'name' => $subscription->plan->name,
                    'currency' => $subscription->plan->currency,
                    'monthlyPriceMinor' => $subscription->plan->monthly_price_minor,
                    'yearlyPriceMinor' => $subscription->plan->yearly_price_minor,
                ],
            ] : null,
            'usage' => collect($metrics)->map(fn (int $current, string $metric): array => [
                'metric' => $metric,
                'current' => $current,
                'limit' => $modules->get($metric)?->limit_value,
                'enabled' => (bool) ($modules->get($metric)?->enabled ?? false),
                'remaining' => $modules->get($metric)?->limit_value === null
                    ? null
                    : max(0, $modules->get($metric)->limit_value - $current),
            ])->values(),
        ]);
    }
}
