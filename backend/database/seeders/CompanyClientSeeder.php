<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\User;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Service;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class CompanyClientSeeder extends Seeder
{
    /**
     * إنشاء حساب شركة تجريبي كامل (L'Oreal Professionnel)
     * يستخدم رقم الهاتف للدخول.
     */
    public function run(): void
    {
        // 1. إنشاء الـ Tenant (الشركة)
        $tenant = Tenant::firstOrCreate(
            ['domain' => 'loreal.o2oeg.local'],
            [
                'name'              => "L'Oreal Professionnel EG",
                'phone'             => '01100000002',
                'address'           => 'مدينة نصر، القاهرة',
                'status'            => 'active',
                'business_category' => 'company',
                'has_full_access'   => false,
            ]
        );

        // 2. إنشاء المستخدم (يدخل برقم الهاتف)
        $user = User::firstOrCreate(
            ['phone' => '01100000002'],
            [
                'tenant_id' => $tenant->id,
                'name'      => 'مدير L\'Oreal',
                'email'     => null,
                'password'  => Hash::make('password123'),
                'role'      => 'tenant_admin',
            ]
        );

        // 3. ربط اشتراك نشط
        $plan = Plan::first();
        if ($plan) {
            Subscription::updateOrCreate(
                ['tenant_id' => $tenant->id],
                [
                    'plan_id'   => $plan->id,
                    'status'    => 'active',
                    'starts_at' => Carbon::now(),
                    'ends_at'   => Carbon::now()->addYear(),
                ]
            );
        }

        // 4. تفعيل خدمة CRM للشركة
        $crmService = Service::whereNull('tenant_id')->where('slug', 'crm')->first();
        if ($crmService) {
            $tenant->services()->syncWithoutDetaching([
                $crmService->id => [
                    'status'       => 'active',
                    'activated_at' => now(),
                ]
            ]);
        }

        $this->command->info("✅ تم إنشاء حساب الشركة بنجاح!");
        $this->command->info("   📞 رقم الهاتف: 01100000002");
        $this->command->info("   🔑 كلمة المرور: password123");
        $this->command->info("   🏢 اسم الشركة: L'Oreal Professionnel EG");
    }
}
