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

        // ربط الخدمات بالباقات باستخدام الـ Slug لضمان الدقة
        $bookingService = Service::where('slug', 'ai-booking')->first();
        $aiService = Service::where('slug', 'will-ai')->first();
        $crmService = Service::where('slug', 'crm')->first();
        $marketService = Service::where('slug', 'retail-store')->first();
        $adsService = Service::where('slug', 'ads-events')->first();

        if ($bookingService) {
            $essentialSalon->services()->attach($bookingService->id);
            $proSalon->services()->attach($bookingService->id);
        }

        if ($aiService) {
            $proSalon->services()->attach($aiService->id);
            $enterprisePlan->services()->attach($aiService->id);
        }

        if ($crmService) {
            $enterprisePlan->services()->attach($crmService->id);
        }

        if ($marketService) {
            $proSalon->services()->attach($marketService->id);
            $enterprisePlan->services()->attach($marketService->id);
        }

        if ($adsService) {
            $enterprisePlan->services()->attach($adsService->id);
        }
    }
}
