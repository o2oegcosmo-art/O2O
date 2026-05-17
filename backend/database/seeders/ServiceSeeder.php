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
            ['name' => 'منظومة الحجوزات الذكية', 'slug' => 'smart-booking-system', 'target_audience' => 'salon', 'pricing_type' => 'subscription'],
            ['name' => 'نظام إدارة العملاء', 'slug' => 'crm-system', 'target_audience' => 'salon', 'pricing_type' => 'subscription'],
            ['name' => 'الصفحة العامة', 'slug' => 'public-page', 'target_audience' => 'salon', 'pricing_type' => 'free'],
            ['name' => 'المتجر الإلكتروني', 'slug' => 'e-commerce', 'target_audience' => 'salon', 'pricing_type' => 'subscription'],
            ['name' => 'إدارة الفعاليات', 'slug' => 'events-management', 'target_audience' => 'company', 'pricing_type' => 'subscription'],
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
