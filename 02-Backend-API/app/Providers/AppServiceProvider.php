<?php

namespace App\Providers;

use App\Contracts\Notifications\PushNotificationProvider;
use App\Contracts\Payments\PaymentProvider;
use App\Services\Notifications\DisabledPushNotificationProvider;
use App\Services\Notifications\FcmPushNotificationProvider;
use App\Services\Observability\AlertNotificationService;
use App\Services\Payments\DisabledPaymentProvider;
use App\Services\Payments\PaymobGatewayService;
use App\Services\Security\Malware\ClamAvScanner;
use App\Services\Security\Malware\HeuristicScanner;
use App\Services\Security\Malware\MalwareScannerInterface;
use App\Services\Security\Malware\MockScanner;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Queue\Events\JobFailed;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use InvalidArgumentException;
use LogicException;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(
            PaymentProvider::class,
            fn ($app) => match (config('services.payment.provider', 'paymob')) {
                'disabled' => new DisabledPaymentProvider,
                default => $app->make(PaymobGatewayService::class),
            },
        );
        $this->app->bind(PushNotificationProvider::class, fn () => match (config('push.provider')) {
            'fcm' => new FcmPushNotificationProvider,
            default => new DisabledPushNotificationProvider,
        });
        $this->app->bind(MalwareScannerInterface::class, function (): MalwareScannerInterface {
            $driver = (string) config('malware_scanner.driver', 'clamav');

            return match ($driver) {
                'clamav' => new ClamAvScanner(config('malware_scanner.clamav', [])),
                'heuristic' => new HeuristicScanner,
                'mock' => new MockScanner,
                default => throw new InvalidArgumentException(
                    "Unsupported malware scanner driver [{$driver}].",
                ),
            };
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (
            $this->app->isProduction()
            && config('malware_scanner.driver') !== 'clamav'
        ) {
            throw new LogicException(
                'Production requires the ClamAV malware scanner driver.',
            );
        }

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

        Queue::failing(function (JobFailed $event): void {
            try {
                app(AlertNotificationService::class)->notifyQueueFailure(
                    connection: $event->connectionName,
                    queue: $event->job->getQueue(),
                    jobClass: $event->job->resolveName(),
                    exception: $event->exception,
                    jobId: $event->job->getJobId(),
                );
            } catch (\Throwable $e) {
                // Fail-safe: prevent recursive queue listener exceptions
            }
        });
    }
}
