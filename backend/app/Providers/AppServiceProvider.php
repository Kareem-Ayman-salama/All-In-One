<?php

namespace App\Providers;

use App\Contracts\Notifications\PushNotificationProvider;
use App\Contracts\Payments\PaymentProvider;
use App\Services\Notifications\DisabledPushNotificationProvider;
use App\Services\Payments\DisabledPaymentProvider;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(
            PaymentProvider::class,
            DisabledPaymentProvider::class,
        );
        $this->app->bind(
            PushNotificationProvider::class,
            DisabledPushNotificationProvider::class,
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('login', fn (Request $request): Limit => Limit::perMinute(5)
            ->by(mb_strtolower((string) $request->input('email')).'|'.$request->ip()));
        RateLimiter::for('verification', fn (Request $request): Limit => Limit::perMinute(5)
            ->by(mb_strtolower((string) $request->input('email')).'|'.$request->ip()));
        RateLimiter::for('public-booking', fn (Request $request): Limit => Limit::perMinute(10)
            ->by($request->ip()));
        RateLimiter::for('support', fn (Request $request): Limit => Limit::perHour(5)
            ->by($request->user()?->id ?: $request->ip()));
        RateLimiter::for('otp-operations', fn (Request $request): Limit => Limit::perMinutes(10, 3)
            ->by($request->user()?->id ?: $request->ip()));
        RateLimiter::for('content-playback', fn (Request $request): Limit => Limit::perMinute(60)
            ->by(($request->user()?->id ?: 'guest').'|'.$request->ip()));
    }
}
