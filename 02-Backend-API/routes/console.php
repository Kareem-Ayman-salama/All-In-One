<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('attendance:send-weekly-guardian-reports')
    ->weeklyOn(1, '08:00')
    ->withoutOverlapping()
    ->onOneServer();

Schedule::command('aio:dispatch-outbox')
    ->everyMinute()
    ->withoutOverlapping()
    ->onOneServer();
Schedule::command('aio:maintenance')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->onOneServer();

Schedule::command('privacy:process-deletions')
    ->hourly()
    ->withoutOverlapping()
    ->onOneServer();

Schedule::command('privacy:purge-expired-data')
    ->daily()
    ->withoutOverlapping()
    ->onOneServer();

Schedule::command('security:scan-assets')
    ->everyTenMinutes()
    ->withoutOverlapping()
    ->onOneServer();

Schedule::command('health:check-services')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->onOneServer();

Schedule::command('backup:create --label=daily_auto')
    ->dailyAt('02:00')
    ->withoutOverlapping()
    ->onOneServer();

Schedule::command('payments:reconcile --auto-fix')
    ->dailyAt('03:00')
    ->withoutOverlapping()
    ->onOneServer();
