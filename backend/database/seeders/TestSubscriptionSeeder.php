<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\Plan;
use App\Models\Service;
use App\Models\Subscription;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class TestSubscriptionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Get the first tenant (our test tenant)
        $tenant = Tenant::first();

        if (!$tenant) {
            $this->command->warn('No tenant found. Please ensure a tenant is seeded (e.g., by running TenantSeeder).');
            return;
        }

        // 2. تأكيد وجود باقة Pro وربطها بميزة الـ AI
        $proPlan = Plan::firstOrCreate(
            ['name' => 'Pro Plan'],
            [
                'description' => 'باقة شاملة مع موظف استقبال ذكي',
                'price' => 999,
                'billing_interval' => 'monthly'
            ]
        );

        // التأكد من أن ميزة الـ AI موجودة كموديل Service (SaaS Service) ومربوطة بالخطة
        // ملاحظة: هذا يختلف عن خدمات الصالون (مثل قص الشعر)، هذه ميزة في المنصة
        $aiFeature = Service::firstOrCreate(
            ['slug' => 'ai-receptionist'],
            ['name' => 'AI Receptionist', 'price' => 0] // السعر 0 لأنها جزء من الباقة
        );

        if (!$proPlan->services()->where('slug', 'ai-receptionist')->exists()) {
            $proPlan->services()->attach($aiFeature->id);
        }

        // 3. Create or update an active subscription for the tenant to the Pro Plan
        Subscription::updateOrCreate(
            ['tenant_id' => $tenant->id], // Find by tenant_id
            [
                'plan_id' => $proPlan->id,
                'status' => 'active',
                'starts_at' => Carbon::now(),
                'ends_at' => Carbon::now()->addYear(), // Active for one year
            ]
        );

        $this->command->info('Test subscription for AI feature created/updated successfully for tenant: ' . $tenant->name);
    }
}