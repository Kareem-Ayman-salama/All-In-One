<?php

namespace App\Services\Plans;

use App\Exceptions\ApiException;
use App\Models\Organization;
use App\Models\OrganizationSubscription;
use App\Models\OrganizationUsageCounter;
use App\Models\PlanModule;
use Illuminate\Support\Str;

class EntitlementService
{
    public function entitlement(
        Organization $organization,
        string $module,
    ): PlanModule {
        $subscription = $this->activeSubscription($organization);
        $entitlement = $subscription?->plan?->modules
            ->firstWhere('module', $module);

        if (! $entitlement || ! $entitlement->enabled) {
            throw new ApiException(
                'MODULE_DISABLED',
                'This module is not available on the current plan.',
                403,
                [
                    'module' => $module,
                    'currentPlan' => $subscription?->plan?->code,
                    'upgradeRequired' => true,
                ],
            );
        }

        return $entitlement;
    }

    public function activeSubscription(
        Organization $organization,
    ): ?OrganizationSubscription {
        return $organization->subscriptions()
            ->with('plan.modules')
            ->currentlyAccessible()
            ->latest('current_period_ends_at')
            ->first();
    }

    public function assertCurrentCount(
        Organization $organization,
        string $module,
        int $currentCount,
        int $increment = 1,
    ): void {
        $entitlement = $this->entitlement($organization, $module);
        if ($entitlement->limit_value !== null
            && $currentCount + $increment > $entitlement->limit_value) {
            throw new ApiException(
                'PLAN_LIMIT_REACHED',
                'The current plan limit has been reached.',
                409,
                [
                    'module' => $module,
                    'limit' => $entitlement->limit_value,
                    'current' => $currentCount,
                    'upgradeRequired' => true,
                ],
            );
        }
    }

    public function consumeMonthly(
        Organization $organization,
        string $metric,
        int $amount = 1,
    ): OrganizationUsageCounter {
        $entitlement = $this->entitlement($organization, $metric);
        $periodKey = now()->format('Y-m');
        OrganizationUsageCounter::query()->insertOrIgnore([
            'id' => (string) Str::uuid(),
            'organization_id' => $organization->id,
            'metric' => $metric,
            'period_key' => $periodKey,
            'value' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $counter = OrganizationUsageCounter::query()
            ->where('organization_id', $organization->id)
            ->where('metric', $metric)
            ->where('period_key', $periodKey)
            ->lockForUpdate()
            ->firstOrFail();

        if ($entitlement->limit_value !== null
            && $counter->value + $amount > $entitlement->limit_value) {
            throw new ApiException(
                'PLAN_LIMIT_REACHED',
                'The monthly plan limit has been reached.',
                409,
                [
                    'module' => $metric,
                    'limit' => $entitlement->limit_value,
                    'current' => $counter->value,
                    'upgradeRequired' => true,
                ],
            );
        }

        $counter->increment('value', $amount);

        return $counter->fresh();
    }
}
