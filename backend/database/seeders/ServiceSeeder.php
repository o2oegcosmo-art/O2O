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
            ['name' => 'نظام الحجز الذكي', 'slug' => 'ai-booking', 'target_audience' => 'salon', 'type' => 'platform'],
            ['name' => 'نظام إدارة العملاء CRM', 'slug' => 'crm', 'target_audience' => 'company', 'type' => 'platform'],
            ['name' => 'استشارات Will AI', 'slug' => 'will-ai', 'target_audience' => 'salon', 'type' => 'platform'],
            ['name' => 'متجر التجزئة الإلكتروني', 'slug' => 'retail-store', 'target_audience' => 'salon', 'type' => 'platform'],
            ['name' => 'نظام الفعاليات والإعلانات', 'slug' => 'ads-events', 'target_audience' => 'company', 'type' => 'platform'],
        ];

        foreach ($services as $service) {
            \App\Models\Service::create([
                'tenant_id' => null, 
                'name' => $service['name'],
                'slug' => $service['slug'],
                'description' => 'خدمة منصة أساسية مشتركة',
                'status' => 'active',
                'target_audience' => $service['target_audience'],
                'pricing_type' => 'subscription',
                'price' => 0,
            ]);
        }
    }
}
