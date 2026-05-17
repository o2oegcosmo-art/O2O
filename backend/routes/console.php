<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use Illuminate\Support\Facades\Schedule;
Schedule::command('social:publish-scheduled')->everyFiveMinutes();
Schedule::command('production:backup')->dailyAt('00:00')->onOneServer();
Schedule::command('system:cleanup --force')->dailyAt('03:00')->onOneServer();
