<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Service;
use App\Models\Tenant;

class EgyptianSalonServicesSeeder extends Seeder
{
    public function run(): void
    {
        // Get the test salon tenant (01111111111)
        $tenant = Tenant::where('name', '!=', 'O2OEG Platform Admin')->first();
        
        if (!$tenant) {
            $this->command->error('No salon tenant found. Please run create_salon logic first.');
            return;
        }

        $services = [
            [
                'name' => 'قص شعر (حريمي/رجالي)',
                'slug' => 'hair-cut',
                'description' => 'قص شعر احترافي مع غسيل وسشوار بسيط',
                'price' => 150.00,
                'status' => 'active',
                'target_audience' => 'salon',
                'pricing_type' => 'free',
            ],
            [
                'name' => 'سشوار وبيبي ليس',
                'slug' => 'hair-styling',
                'description' => 'تصفيف شعر احترافي للمناسبات أو الاستخدام اليومي',
                'price' => 200.00,
                'status' => 'active',
                'target_audience' => 'salon',
                'pricing_type' => 'free',
            ],
            [
                'name' => 'صبغة شعر كاملة',
                'slug' => 'hair-coloring',
                'description' => 'صبغة شعر كاملة بأجود الأنواع المتوفرة لتغطية مثالية ولون جذاب',
                'price' => 850.00,
                'status' => 'active',
                'target_audience' => 'salon',
                'pricing_type' => 'free',
            ],
            [
                'name' => 'تنظيف بشرة عميق',
                'slug' => 'facial-cleaning',
                'description' => 'جلسة تنظيف بشرة 7 مراحل مع ماسك الذهب',
                'price' => 450.00,
                'status' => 'active',
                'target_audience' => 'salon',
                'pricing_type' => 'free',
            ],
            [
                'name' => 'باديكير ومانيكير كامل',
                'slug' => 'nail-care',
                'description' => 'تنظيف وتقليم أظافر اليدين والقدمين مع مساج خفيف',
                'price' => 300.00,
                'status' => 'active',
                'target_audience' => 'salon',
                'pricing_type' => 'free',
            ],
            [
                'name' => 'ميك اب سواريه',
                'slug' => 'soiree-makeup',
                'description' => 'مكياج كامل للمناسبات باستخدام ماركات عالمية',
                'price' => 1200.00,
                'status' => 'active',
                'target_audience' => 'salon',
                'pricing_type' => 'free',
            ],
            [
                'name' => 'حمام مغربي أصلي',
                'slug' => 'moroccan-bath',
                'description' => 'حمام مغربي بالصابون المغربي والليفة الأصلية والبخار',
                'price' => 600.00,
                'status' => 'active',
                'target_audience' => 'salon',
                'pricing_type' => 'free',
            ],
            [
                'name' => 'بروتين معالج للشعر',
                'slug' => 'hair-protein',
                'description' => 'فرد ومعالجة الشعر بالبروتين الخالي من الفورمالين',
                'price' => 2500.00,
                'status' => 'active',
                'target_audience' => 'salon',
                'pricing_type' => 'free',
            ],
        ];

        foreach ($services as $service) {
            // Append tenant ID to slug to ensure global uniqueness
            $service['slug'] = $service['slug'] . '-' . substr($tenant->id, 0, 8);
            
            Service::updateOrCreate(
                ['tenant_id' => $tenant->id, 'name' => $service['name']],
                $service
            );
        }

        $this->command->info('✅ Egyptian Salon Services seeded for tenant: ' . $tenant->name);
    }
}
