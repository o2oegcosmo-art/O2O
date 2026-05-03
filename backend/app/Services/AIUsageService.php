<?php

namespace App\Services;

use App\Models\Tenant;
use Illuminate\Support\Facades\Cache;

class AIUsageService
{
    /**
     * التحقق مما إذا كان المستأجر يمكنه استخدام الذكاء الاصطناعي بناءً على باقته الحالية
     */
    public function canUseAI(Tenant $tenant): bool
    {
        // نجلب الباقة الحالية للمستأجر عبر العلاقة في الموديل (تأكد من وجودها)
        $subscription = $tenant->subscriptions()->where('status', 'active')->latest()->first();
        $plan = $subscription ? $subscription->plan : null;
        
        if (!$plan) {
            // إذا لم يكن هناك باقة، قد نستخدم حدوداً افتراضية ضيقة جداً
            return false;
        }

        $dailyUsage   = $this->getDailyUsage($tenant->id);
        $monthlyUsage = $this->getMonthlyUsage($tenant->id);

        return $dailyUsage < ($plan->ai_daily_limit ?? 100)
            && $monthlyUsage < ($plan->ai_monthly_limit ?? 2000);
    }

    /**
     * زيادة عداد الاستخدام للمستأجر
     */
    public function incrementUsage(Tenant $tenant): void
    {
        $dailyKey   = "ai_usage:{$tenant->id}:daily:" . now()->format('Y-m-d');
        $monthlyKey = "ai_usage:{$tenant->id}:monthly:" . now()->format('Y-m');

        Cache::increment($dailyKey);
        Cache::increment($monthlyKey);

        // تعيين وقت انتهاء الصلاحية إذا كان المفتاح جديداً
        if ((int)Cache::get($dailyKey) === 1) {
            Cache::put($dailyKey, 1, now()->endOfDay());
        }
        if ((int)Cache::get($monthlyKey) === 1) {
            Cache::put($monthlyKey, 1, now()->endOfMonth());
        }
    }

    public function getDailyUsage($tenantId): int
    {
        return (int) Cache::get("ai_usage:{$tenantId}:daily:" . now()->format('Y-m-d'), 0);
    }

    public function getMonthlyUsage($tenantId): int
    {
        return (int) Cache::get("ai_usage:{$tenantId}:monthly:" . now()->format('Y-m'), 0);
    }

    public function getRemainingRequests(Tenant $tenant): array
    {
        $subscription = $tenant->subscriptions()->where('status', 'active')->latest()->first();
        $plan = $subscription ? $subscription->plan : null;
        
        $dailyLimit = $plan->ai_daily_limit ?? 0;
        $monthlyLimit = $plan->ai_monthly_limit ?? 0;

        return [
            'daily_remaining'   => max(0, $dailyLimit - $this->getDailyUsage($tenant->id)),
            'monthly_remaining' => max(0, $monthlyLimit - $this->getMonthlyUsage($tenant->id)),
        ];
    }
}

