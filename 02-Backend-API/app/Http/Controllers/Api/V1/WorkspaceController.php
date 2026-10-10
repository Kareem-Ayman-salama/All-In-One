<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\OrganizationMembership;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkspaceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $memberships = OrganizationMembership::query()
            ->with([
                'organization',
                'role.permissions',
                'organization.subscriptions' => fn ($query) => $query
                    ->with('plan.modules')
                    ->latest('current_period_ends_at'),
            ])
            ->where('user_id', $request->user()->id)
            ->where('status', 'active')
            ->get();

        return ApiResponse::success($request, $memberships->map(
            fn (OrganizationMembership $membership): array => [
                'membershipId' => $membership->id,
                'organization' => [
                    'id' => $membership->organization->id,
                    'name' => $membership->organization->name,
                    'slug' => $membership->organization->slug,
                    'type' => $membership->organization->type,
                    'logo' => $membership->organization->logo_path,
                    'status' => $membership->organization->status,
                ],
                'role' => $membership->role->name,
                'permissions' => $membership->role->permissions
                    ->pluck('name')
                    ->values(),
                'subscription' => $this->subscription(
                    $membership->organization->subscriptions->first(),
                ),
            ],
        ));
    }

    public function context(Request $request): JsonResponse
    {
        /** @var OrganizationMembership $membership */
        $membership = $request->attributes->get('organization_membership');
        $organization = $request->attributes->get('active_organization');
        $subscription = $organization->subscriptions()
            ->with('plan.modules')
            ->latest('current_period_ends_at')
            ->first();

        return ApiResponse::success($request, [
            'organization' => $organization,
            'membership' => [
                'id' => $membership->id,
                'role' => $membership->role->name,
                'permissions' => $membership->role->permissions
                    ->pluck('name')
                    ->values(),
            ],
            'subscription' => $this->subscription($subscription),
        ]);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function subscription(mixed $subscription): ?array
    {
        if (! $subscription) {
            return null;
        }

        return [
            'id' => $subscription->id,
            'status' => $subscription->status,
            'billingInterval' => $subscription->billing_interval,
            'currentPeriodEndsAt' => $subscription->current_period_ends_at,
            'plan' => [
                'code' => $subscription->plan->code,
                'name' => $subscription->plan->name,
                'monthlyPriceMinor' => $subscription->plan->monthly_price_minor,
                'yearlyPriceMinor' => $subscription->plan->yearly_price_minor,
                'currency' => $subscription->plan->currency,
                'modules' => $subscription->plan->modules->map(
                    fn ($module): array => [
                        'module' => $module->module,
                        'enabled' => $module->enabled,
                        'limit' => $module->limit_value,
                    ],
                ),
            ],
        ];
    }
}
