<?php

namespace Database\Seeders;

use App\Models\CrmStylist;
use App\Models\CrmStylistCertification;
use App\Models\CrmClient;
use App\Models\Event;
use App\Models\Tenant;
use Illuminate\Database\Seeder;

class EducationROISeeder extends Seeder
{
    public function run(): void
    {
        $company = Tenant::where('name', 'LIKE', '%Platform Admin%')->first();
        if (!$company) return;

        $salons = CrmClient::where('tenant_id', $company->id)->get();
        $event = Event::where('tenant_id', $company->id)->first();
        
        if (!$event) return;

        // 1. إضافة مصففين لبعض الصالونات
        foreach ($salons->take(3) as $salon) {
            $stylist = CrmStylist::create([
                'tenant_id' => $company->id,
                'crm_client_id' => $salon->id,
                'name' => 'خبير ' . $salon->salon_name,
                'specialization' => 'خبير صبغة ومعالجة',
                'phone' => '01000000000'
            ]);

            // 2. منحهم شهادة حضور الفعالية
            CrmStylistCertification::create([
                'crm_stylist_id' => $stylist->id,
                'event_id' => $event->id,
                'certified_at' => now()->subDays(10)
            ]);
            
            // تحديث بيانات الصالون لرفع قيمة المشتريات (لإثبات الـ ROI)
            $salon->update(['monthly_spend' => $salon->monthly_spend * 1.5]);
        }
    }
}
