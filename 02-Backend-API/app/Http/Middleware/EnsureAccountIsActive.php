<?php

namespace App\Http\Middleware;

use App\Exceptions\ApiException;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAccountIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || $user->status !== 'active') {
            throw new ApiException(
                'ACCOUNT_DISABLED',
                'This account is not available.',
                403,
            );
        }

        return $next($request);
    }
}
