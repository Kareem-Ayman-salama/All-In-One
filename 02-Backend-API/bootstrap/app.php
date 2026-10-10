<?php

use App\Exceptions\ApiException;
use App\Http\Middleware\AssignRequestId;
use App\Http\Middleware\EnsureAccountIsActive;
use App\Http\Middleware\LogApiRequest;
use App\Http\Middleware\RequireModule;
use App\Http\Middleware\RequirePermission;
use App\Http\Middleware\RequirePlatformRole;
use App\Http\Middleware\ResolveOrganizationContext;
use App\Support\ApiResponse;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->prepend(AssignRequestId::class);
        $middleware->appendToGroup('api', LogApiRequest::class);
        $middleware->alias([
            'account.active' => EnsureAccountIsActive::class,
            'organization.context' => ResolveOrganizationContext::class,
            'module' => RequireModule::class,
            'platform.role' => RequirePlatformRole::class,
            'permission' => RequirePermission::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
        $exceptions->render(function (ApiException $exception, Request $request) {
            return ApiResponse::error(
                $request,
                $exception->errorCode,
                $exception->getMessage(),
                $exception->status,
                $exception->details,
            );
        });
        $exceptions->render(function (ValidationException $exception, Request $request) {
            return ApiResponse::error(
                $request,
                'VALIDATION_ERROR',
                'The request is invalid.',
                422,
                ['fields' => $exception->errors()],
            );
        });
        $exceptions->render(function (AuthenticationException $exception, Request $request) {
            return ApiResponse::error(
                $request,
                'AUTHENTICATION_REQUIRED',
                'Authentication is required.',
                401,
            );
        });
        $exceptions->render(function (ModelNotFoundException $exception, Request $request) {
            return ApiResponse::error(
                $request,
                'RESOURCE_NOT_FOUND',
                'The requested resource was not found.',
                404,
            );
        });
        $exceptions->render(function (TooManyRequestsHttpException $exception, Request $request) {
            return ApiResponse::error(
                $request,
                'RATE_LIMITED',
                'Too many requests. Please try again later.',
                429,
            );
        });
    })->create();
