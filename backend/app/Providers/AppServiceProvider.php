<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Notification;
use App\Channels\WhatsAppChannel;
use Illuminate\Support\Facades\Gate;
use App\Models\User;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register custom WhatsApp notification channel
        Notification::extend('whatsapp', function ($app) {
            return new WhatsAppChannel();
        });

        // Define admin access gate
        Gate::define('admin-access', function (User $user) {
            return $user->role === 'admin';
        });

        // Super Admin bypass for all gates/policies
        \Illuminate\Support\Facades\Gate::before(function ($user, $ability) {
            if ($user->role === 'admin') {
                return true;
            }
        });

        // 🟢 Rate Limiting Configuration
        $this->configureRateLimiting();
    }

    /**
     * Configure the rate limiters for the application.
     */
    protected function configureRateLimiting(): void
    {
        // Rate limiter للـ Webhook العام (Meta Verification)
        \Illuminate\Support\Facades\RateLimiter::for('webhook', function (\Illuminate\Http\Request $request) {
            return \Illuminate\Cache\RateLimiting\Limit::perMinute(60)->by($request->ip());
        });

        // Rate limiter مشدد للـ AI webhook (استلام رسائل الواتساب ومعالجتها)
        \Illuminate\Support\Facades\RateLimiter::for('ai_webhook', function (\Illuminate\Http\Request $request) {
            // نحاول تحديد المستأجر من البيانات إذا أمكن (لإحصائيات دقيقة) أو نكتفي بالـ IP
            $phoneId = $request->input('entry.0.changes.0.value.metadata.phone_number_id', $request->ip());
            return [
                \Illuminate\Cache\RateLimiting\Limit::perMinute(30)->by('ip:' . $request->ip()),
                \Illuminate\Cache\RateLimiting\Limit::perHour(500)->by('tenant:' . $phoneId),
            ];
        });

        // Rate limiter للـ API العام
        \Illuminate\Support\Facades\RateLimiter::for('api', function (\Illuminate\Http\Request $request) {
            return $request->user()
                ? \Illuminate\Cache\RateLimiting\Limit::perMinute(120)->by($request->user()->id)
                : \Illuminate\Cache\RateLimiting\Limit::perMinute(30)->by($request->ip());
        });
    }
}

