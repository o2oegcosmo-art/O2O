<?php

namespace Database\Seeders;

use App\Models\Staff;
use App\Models\CrmVisit;
use App\Models\CrmClient;
use App\Models\Tenant;
use Illuminate\Database\Seeder;

class SalesTeamSeeder extends Seeder
{
    public function run(): void
    {
        $company = Tenant::where('name', 'LIKE', '%Platform Admin%')->first();
        if (!$company) return;

        // 1. إضافة مناديب مبيعات
        $reps = [
            ['name' => 'أحمد محمود', 'phone' => '01011111111'],
            ['name' => 'سارة حسن', 'phone' => '01022222222'],
            ['name' => 'محمد علي', 'phone' => '01033333333'],
        ];

        foreach ($reps as $r) {
            $staff = Staff::create([
                'tenant_id' => $company->id,
                'name' => $r['name'],
                'specialization' => 'Sales Rep',
                'phone' => $r['phone'],
                'is_active' => true,
            ]);

            // 2. إضافة زيارات تجريبية لهؤلاء المناديب
            $salons = CrmClient::where('tenant_id', $company->id)->get();
            foreach ($salons->take(3) as $salon) {
                CrmVisit::create([
                    'tenant_id' => $company->id,
                    'staff_id' => $staff->id,
                    'crm_client_id' => $salon->id,
                    'visited_at' => now()->subHours(rand(1, 48)),
                    'notes' => 'تم عرض مجموعة الصبغات الجديدة ومراجعة المخزون.',
                    'outcome' => ['Order Placed', 'Follow up required', 'Product Demo'][rand(0, 2)],
                    'lat' => 30.0444,
                    'lng' => 31.2357
                ]);
            }
        }
    }
}
