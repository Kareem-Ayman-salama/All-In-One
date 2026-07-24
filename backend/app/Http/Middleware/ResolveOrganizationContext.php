<?php

namespace App\Http\Middleware;

use App\Exceptions\ApiException;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveOrganizationContext
{
    public function handle(Request $request, Closure $next): Response
    {
        $identifier = (string) $request->route('organization');
        $organization = Organization::query()
            ->where('id', $identifier)
            ->orWhere('slug', $identifier)
            ->first();

        if (! $organization) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Organization not found.', 404);
        }

        if ($organization->status !== 'active') {
            throw new ApiException(
                'ORGANIZATION_SUSPENDED',
                'This organization is not available.',
                403,
            );
        }

        $membership = OrganizationMembership::query()
            ->with('role.permissions')
            ->where('organization_id', $organization->id)
            ->where('user_id', $request->user()->id)
            ->where('status', 'active')
            ->first();

        if (! $membership) {
            throw new ApiException(
                'TENANT_ACCESS_DENIED',
                'You do not have access to this organization.',
                403,
            );
        }

        $request->attributes->set('active_organization', $organization);
        $request->attributes->set('organization_membership', $membership);

        return $next($request);
    }
}
