<?php

namespace Database\Seeders;

use App\Models\Plan;
use App\Models\Service;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        // 1. باقة الصالونات الأساسية (Essential Salon)
        $essentialSalon = Plan::updateOrCreate(
            ['slug' => 'essential-salon'],
            [
                'name' => 'صالون أساسي',
                'description' => 'مثالية للصالونات الناشئة - تشمل نظام الحجوزات الأساسي.',
                'price' => 499.00,
                'billing_interval' => 'month',
                'trial_period_days' => 14,
                'is_active' => true,
            ]
        );

        // 2. باقة الصالونات الاحترافية (Pro Salon - AI Powered)
        $proSalon = Plan::updateOrCreate(
            ['slug' => 'pro-salon-ai'],
            [
                'name' => 'صالون احترافي (AI)',
                'description' => 'تشمل الحجوزات + موظف استقبال ذكي (AI Receptionist) يعمل على واتساب.',
                'price' => 999.00,
                'billing_interval' => 'month',
                'trial_period_days' => 7,
                'is_active' => true,
            ]
        );

        // 3. باقة الشركات (Enterprise/Company)
        $enterprisePlan = Plan::updateOrCreate(
            ['slug' => 'enterprise-company'],
            [
                'name' => 'منظومة الشركات',
                'description' => 'لشركات توريد مستحضرات التجميل - تشمل لوحة تحكم متقدمة ومستشار أعمال ذكي.',
                'price' => 2499.00,
                'billing_interval' => 'month',
                'trial_period_days' => 0,
                'is_active' => true,
            ]
        );

        // ربط الخدمات بالباقات باستخدام الـ Slug الجديد الموحد
        $bookingService = Service::where('slug', 'smart-booking-system')->first();
        $crmService = Service::where('slug', 'crm-system')->first();
        $publicPage = Service::where('slug', 'public-page')->first();
        $ecommerce = Service::where('slug', 'e-commerce')->first();
        $events = Service::where('slug', 'events-management')->first();

        // 1. باقة الأساسي (Essential): حجوزات + صفحة عامة
        if ($bookingService) $essentialSalon->services()->syncWithoutDetaching([$bookingService->id]);
        if ($publicPage) $essentialSalon->services()->syncWithoutDetaching([$publicPage->id]);

        // 2. باقة الاحترافي (Pro): كل شيء للصالون (حجوزات، CRM، متجر، صفحة عامة)
        if ($bookingService) $proSalon->services()->syncWithoutDetaching([$bookingService->id]);
        if ($crmService) $proSalon->services()->syncWithoutDetaching([$crmService->id]);
        if ($publicPage) $proSalon->services()->syncWithoutDetaching([$publicPage->id]);
        if ($ecommerce) $proSalon->services()->syncWithoutDetaching([$ecommerce->id]);

        // 3. باقة الشركات (Enterprise): كل الخدمات المتاحة
        if ($bookingService) $enterprisePlan->services()->syncWithoutDetaching([$bookingService->id]);
        if ($crmService) $enterprisePlan->services()->syncWithoutDetaching([$crmService->id]);
        if ($publicPage) $enterprisePlan->services()->syncWithoutDetaching([$publicPage->id]);
        if ($ecommerce) $enterprisePlan->services()->syncWithoutDetaching([$ecommerce->id]);
        if ($events) $enterprisePlan->services()->syncWithoutDetaching([$events->id]);
    }
}
