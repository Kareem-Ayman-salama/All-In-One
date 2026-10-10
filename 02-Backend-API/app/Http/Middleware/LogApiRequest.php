<?php

namespace App\Http\Middleware;

use App\Exceptions\ApiException;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class LogApiRequest
{
    public function handle(Request $request, Closure $next): Response
    {
        $startedAt = hrtime(true);

        try {
            $response = $next($request);
            $this->write($request, $response->getStatusCode(), $startedAt);

            return $response;
        } catch (Throwable $exception) {
            $status = $exception instanceof ApiException
                ? $exception->status
                : 500;
            $this->write(
                $request,
                $status,
                $startedAt,
                $exception::class,
            );

            throw $exception;
        }
    }

    private function write(
        Request $request,
        int $status,
        int $startedAt,
        ?string $exceptionClass = null,
    ): void {
        $organization = $request->attributes->get('active_organization');
        $context = [
            'requestId' => $request->attributes->get('request_id'),
            'method' => $request->method(),
            'route' => $request->route()?->getName()
                ?: $request->route()?->uri(),
            'status' => $status,
            'durationMs' => round((hrtime(true) - $startedAt) / 1_000_000, 2),
            'userId' => $request->user()?->id,
            'organizationId' => $organization?->id,
        ];
        if ($exceptionClass) {
            $context['exceptionClass'] = $exceptionClass;
        }

        Log::info('aio.http.request', $context);
    }
}
