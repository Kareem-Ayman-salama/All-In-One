<?php

namespace App\Http\Middleware;

use App\Exceptions\ApiException;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequirePlatformRole
{
    public function handle(
        Request $request,
        Closure $next,
        string ...$roles,
    ): Response {
        if (! in_array($request->user()?->platform_role, $roles, true)) {
            throw new ApiException(
                'PLATFORM_ACCESS_DENIED',
                'You do not have access to platform administration.',
                403,
            );
        }

        return $next($request);
    }
}
