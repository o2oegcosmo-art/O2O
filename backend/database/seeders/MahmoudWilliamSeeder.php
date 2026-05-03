<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class MahmoudWilliamSeeder extends Seeder
{
    public function run(): void
    {
        // 1. إنشاء المستأجر الخاص بالإدارة العليا (لوحة تحكم صاحب المشروع)
        $adminTenant = Tenant::firstOrCreate(
            ['id' => '00000000-0000-0000-0000-000000000000'],
            [
                'name' => 'O2OEG Management Hub',
                'domain' => 'admin.o2oeg.com',
                'status' => 'active',
                'business_category' => 'admin',
                'has_full_access' => true
            ]
        );

        // 2. إنشاء حساب محمود وليم (الإدارة العليا)
        User::updateOrCreate(
            ['phone' => '01005383435'],
            [
                'name' => 'محمود وليم',
                'email' => 'mahmoud@o2oeg.com',
                'password' => Hash::make('224466'),
                'role' => 'admin', // الإدارة العليا
                'tenant_id' => $adminTenant->id,
            ]
        );
        
        // 3. إضافة الباقات الافتراضية للمنصة
        $plans = [
            [
                'name' => 'الباقة الأساسية (Starter)',
                'slug' => 'starter',
                'price' => 500,
                'description' => 'مثالية للصالونات الصغيرة والمبتدئة. تشمل الحجز الذكي و CRM أساسي.',
            ],
            [
                'name' => 'الباقة الاحترافية (Professional)',
                'slug' => 'professional',
                'price' => 1500,
                'description' => 'للصالونات والشركات المتوسطة. تشمل Will AI وتحليلات متقدمة.',
            ],
            [
                'name' => 'الباقة اللامحدودة (Enterprise)',
                'slug' => 'enterprise',
                'price' => 5000,
                'description' => 'الحل الشامل لكل الخدمات، المتجر الإلكتروني، والفعاليات اللامحدودة.',
            ],
        ];

        foreach ($plans as $planData) {
            \App\Models\Plan::updateOrCreate(['name' => $planData['name']], $planData);
        }

        // 4. إضافة الخدمات السيادية للمنصة
        $services = [
            ['name' => 'الحجز الذكي', 'slug' => 'ai-booking', 'description' => 'نظام حجز آلي عبر الواتساب والويب'],
            ['name' => 'CRM', 'slug' => 'crm', 'description' => 'إدارة علاقات العملاء والولاء'],
            ['name' => 'Will AI', 'slug' => 'will-ai', 'description' => 'المساعد الذكي لإدارة الأعمال'],
            ['name' => 'المتجر', 'slug' => 'retail-store', 'description' => 'بيع المنتجات مباشرة للعملاء'],
            ['name' => 'الفعاليات', 'slug' => 'ads-events', 'description' => 'نظام الإعلانات والفعاليات الداخلية'],
        ];

        foreach ($services as $serviceData) {
            \App\Models\Service::updateOrCreate(['slug' => $serviceData['slug']], $serviceData);
        }
        
        $this->command->info('Super Admin account, Default Plans, and Services created successfully.');
    }
}
