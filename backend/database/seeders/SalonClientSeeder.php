<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\User;
use App\Models\Service;
use App\Models\Plan;
use App\Models\Subscription;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class SalonClientSeeder extends Seeder
{
    /**
     * إنشاء حساب صالون تجريبي كامل (رشا حمدي) مع اشتراك نشط وخدمات مفعّلة.
     * يستخدم رقم الهاتف (phone) وليس البريد الإلكتروني للدخول.
     */
    public function run(): void
    {
        // 1. إنشاء الـ Tenant (الصالون)
        $tenant = Tenant::firstOrCreate(
            ['domain' => 'rasha-salon.o2oeg.local'],
            [
                'name'              => 'صالون رشا حمدي',
                'phone'             => '01100000001',
                'address'           => 'مدينة نصر، القاهرة',
                'status'            => 'active',
                'business_category' => 'salon',
                'has_full_access'   => false,
            ]
        );

        // 2. إنشاء المستخدم (يدخل برقم الهاتف)
        $user = User::firstOrCreate(
            ['phone' => '01000000001'],
            [
                'tenant_id' => $tenant->id,
                'name'      => 'رشا حمدي',
                'email'     => null, // نظام الدخول يعتمد على الهاتف فقط
                'password'  => Hash::make('password123'),
                'role'      => 'tenant_admin', // صلاحية مدير الصالون
            ]
        );

        // 3. ربط اشتراك نشط بالصالون (حتى يمكنه استخدام الخدمات)
        $plan = Plan::first(); // أي باقة موجودة
        if ($plan) {
            Subscription::updateOrCreate(
                ['tenant_id' => $tenant->id],
                [
                    'plan_id'    => $plan->id,
                    'status'     => 'active',
                    'starts_at'  => Carbon::now(),
                    'ends_at'    => Carbon::now()->addYear(),
                ]
            );
        }

        // 4. تفعيل خدمة Will AI وAI Booking للصالون
        $services = Service::whereNull('tenant_id')
            ->whereIn('slug', ['will-ai', 'ai-booking'])
            ->get();

        foreach ($services as $service) {
            $tenant->services()->syncWithoutDetaching([
                $service->id => [
                    'status'       => 'active',
                    'activated_at' => now(),
                ]
            ]);
        }

        $this->command->info('✅ تم إنشاء صالون رشا حمدي بنجاح!');
        $this->command->info('   📞 رقم الهاتف: 01000000001');
        $this->command->info('   🔑 كلمة المرور: password123');
    }
}
