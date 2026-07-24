<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class AssignRequestId
{
    public function handle(Request $request, Closure $next): Response
    {
        $candidate = (string) $request->headers->get('X-Request-ID', '');
        $requestId = preg_match('/\A[A-Za-z0-9._:-]{1,128}\z/', $candidate)
            ? $candidate
            : Str::uuid()->toString();
        $request->attributes->set('request_id', $requestId);

        $response = $next($request);
        $response->headers->set('X-Request-ID', $requestId);

        return $response;
    }
}
