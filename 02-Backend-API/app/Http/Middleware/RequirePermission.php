<?php

namespace App\Http\Middleware;

use App\Exceptions\ApiException;
use App\Models\OrganizationMembership;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequirePermission
{
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        /** @var OrganizationMembership|null $membership */
        $membership = $request->attributes->get('organization_membership');
        $allowed = $membership?->role?->permissions
            ->contains('name', $permission) ?? false;

        if (! $allowed) {
            throw new ApiException('FORBIDDEN', 'This action is not permitted.', 403);
        }

        return $next($request);
    }
}
