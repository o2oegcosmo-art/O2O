<?php

namespace Database\Seeders;

use App\Models\CrmClient;
use App\Models\CrmOpportunity;
use App\Models\Tenant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CrmSeeder extends Seeder
{
    public function run(): void
    {
        // نستخدم تينانت الشركة الافتراضي (لوريال كمثال)
        $company = Tenant::where('business_category', 'company')->first();
        if (!$company) return;

        // 1. إضافة صالونات عملاء
        $salons = [
            ['name' => 'صالون لوزا بيوتي', 'city' => 'القاهرة', 'tier' => 'vip', 'spend' => 12500],
            ['name' => 'مركز هاني فاروق', 'city' => 'الجيزة', 'tier' => 'regular', 'spend' => 5000],
            ['name' => 'صالون روتانا', 'city' => 'القاهرة', 'tier' => 'lead', 'spend' => 0],
            ['name' => 'بيوتي هاوس', 'city' => 'الإسكندرية', 'tier' => 'regular', 'spend' => 3200],
            ['name' => 'صالون نيفين', 'city' => 'القاهرة', 'tier' => 'vip', 'spend' => 21000],
        ];

        foreach ($salons as $s) {
            $client = CrmClient::create([
                'tenant_id' => $company->id,
                'salon_name' => $s['name'],
                'owner_name' => 'عميل تجريبي',
                'phone' => '010' . rand(10000000, 99999999),
                'city' => $s['city'],
                'size' => ['small', 'medium', 'large'][rand(0, 2)],
                'tier' => $s['tier'],
                'monthly_spend' => $s['spend'],
                'last_visit_at' => now()->subDays(rand(1, 15)),
            ]);

            // 2. إضافة فرص بيعية (Pipeline) للصالونات
            if (rand(0, 1)) {
                CrmOpportunity::create([
                    'tenant_id' => $company->id,
                    'crm_client_id' => $client->id,
                    'title' => 'بيع مجموعة صبغات ' . Str::random(5),
                    'estimated_value' => rand(5000, 20000),
                    'stage' => ['new_lead', 'contacted', 'proposal', 'negotiation'][rand(0, 3)],
                ]);
            }
        }
    }
}
