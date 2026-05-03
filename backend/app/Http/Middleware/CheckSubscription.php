<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckSubscription
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string|null  $serviceSlug  الخدمة المطلوبة (مثل booking, ai-receptionist)
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next, string $serviceSlug = null): Response
    {
        $user = $request->user();
        
        // 1. التحقق من وجود مستخدم
        if (!$user) {
            return response()->json(['message' => 'Unauthorized: No User context found.'], 401);
        }

        // 1.1. ميزة الإدارة العليا: الأدمن يتجاوز كل قيود الاشتراكات
        if ($user->role === 'admin') {
            return $next($request);
        }

        if (!$user->tenant) {
            return response()->json(['message' => 'Unauthorized: No Tenant context found.'], 401);
        }

        $tenant = $user->tenant;

        // 1.1. ميزة الإدارة العليا: إذا كان المستأجر مستثنى من قيود الاشتراك (حساب VIP أو داخلي)
        if ($tenant->has_full_access) {
            return $next($request);
        }

        $subscription = $tenant->activeSubscription;

        // 2. التحقق من حالة الاشتراك أو التفعيل اليدوي من الإدارة
        $isExplicitlyEnabled = $tenant->services()->where('slug', $serviceSlug)->wherePivot('status', 'active')->exists();
        $isInPlan = $subscription && $serviceSlug && $subscription->plan->services()->where('slug', $serviceSlug)->exists();

        // إذا لم تكن الخدمة مجانية (تحتاج slug) ولم تكن مفعلة يدوياً ولا في الخطة، اطلب الاشتراك
        if ($serviceSlug && !$isExplicitlyEnabled && !$isInPlan) {
             if (!$subscription) {
                return response()->json([
                    'error' => 'subscription_required',
                    'message' => 'تحتاج إلى اشتراك نشط للوصول إلى هذه الخدمة.'
                ], 402);
            }
            
            return response()->json([
                'error' => 'plan_limit_reached',
                'message' => 'باقتك الحالية لا تدعم هذه الخاصية. يرجى الترقية أو التواصل مع الإدارة.'
            ], 403);
        }

        // التحكم في الإعلانات بناءً على الباقة والإعدادات
        $canDisableAds = $subscription->plan->price > 0; // أي باقة مدفوعة تستطيع الإلغاء
        $userWantsAds = $tenant->settings->show_ads ?? true;
        
        // إذا كانت الباقة مجانية، الإعلانات إجبارية
        $finalShowAds = $canDisableAds ? $userWantsAds : true;

        $request->attributes->set('can_disable_ads', $canDisableAds);
        $request->attributes->set('show_ads', $finalShowAds);

        return $next($request);
    }
}

