<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('attendance:send-weekly-guardian-reports')
    ->weeklyOn(1, '08:00')
    ->withoutOverlapping();

Schedule::command('aio:dispatch-outbox')
    ->everyMinute()
    ->withoutOverlapping()
    ->onOneServer();
Schedule::command('aio:maintenance')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->onOneServer();
