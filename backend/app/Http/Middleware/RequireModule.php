<?php

namespace App\Http\Middleware;

use App\Exceptions\ApiException;
use App\Models\Organization;
use App\Services\Plans\EntitlementService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireModule
{
    public function __construct(
        private readonly EntitlementService $entitlements,
    ) {}

    public function handle(Request $request, Closure $next, string $module): Response
    {
        /** @var Organization $organization */
        $organization = $request->attributes->get('active_organization');
        $subscription = $this->entitlements->activeSubscription($organization);
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

        $request->attributes->set('module_entitlement', $entitlement);

        return $next($request);
    }
}
