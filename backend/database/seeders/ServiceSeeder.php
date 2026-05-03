<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // حذف الخدمات السيادية القديمة إن وجدت لتجنب التكرار
        \App\Models\Service::whereNull('tenant_id')->delete();

        $services = [
            // موديولات أساسية (مجانية)
            ['name' => 'محرك الحجوزات الأساسي', 'slug' => 'booking-engine', 'target_audience' => 'salon', 'pricing_type' => 'free'],
            ['name' => 'CRM أساسي', 'slug' => 'basic-crm', 'target_audience' => 'salon', 'pricing_type' => 'free'],
            ['name' => 'الصفحة العامة للصالون', 'slug' => 'public-salon-page', 'target_audience' => 'salon', 'pricing_type' => 'free'],
            ['name' => 'بوابة المدفوعات اليدوية', 'slug' => 'manual-payments', 'target_audience' => 'salon', 'pricing_type' => 'free'],
            ['name' => 'لوحة التقارير الأساسية', 'slug' => 'basic-dashboard', 'target_audience' => 'salon', 'pricing_type' => 'free'],

            // موديولات احترافية (مدفوعة)
            ['name' => 'نظام الحجز الذكي (AI)', 'slug' => 'ai-booking', 'target_audience' => 'salon', 'pricing_type' => 'subscription'],
            ['name' => 'نظام إدارة عملاء الشركات CRM', 'slug' => 'crm', 'target_audience' => 'company', 'pricing_type' => 'subscription'],
            ['name' => 'مستشار الذكاء الاصطناعي Will AI', 'slug' => 'will-ai', 'target_audience' => 'salon', 'pricing_type' => 'subscription'],
            ['name' => 'متجر التجزئة الإلكتروني', 'slug' => 'retail-store', 'target_audience' => 'salon', 'pricing_type' => 'subscription'],
            ['name' => 'استوديو السوشيال ميديا والتسويق', 'slug' => 'marketing-studio', 'target_audience' => 'salon', 'pricing_type' => 'subscription'],
            ['name' => 'نظام الفعاليات والإعلانات', 'slug' => 'ads-events', 'target_audience' => 'company', 'pricing_type' => 'subscription'],
        ];

        foreach ($services as $service) {
            \App\Models\Service::create([
                'tenant_id' => null, 
                'name' => $service['name'],
                'slug' => $service['slug'],
                'description' => 'خدمة منصة أساسية مشتركة من O2OEG',
                'status' => 'active',
                'target_audience' => $service['target_audience'],
                'pricing_type' => $service['pricing_type'] ?? 'subscription',
                'price' => 0,
            ]);
        }
    }
}
