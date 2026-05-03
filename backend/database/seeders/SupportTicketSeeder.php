<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\SupportTicket;
use App\Models\Tenant;

class SupportTicketSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tenant = Tenant::first();

        if ($tenant) {
            SupportTicket::create([
                'tenant_id' => $tenant->id,
                'subject' => 'مشكلة في حجز المواعيد مع واتساب',
                'description' => 'العملاء يشتكون من تأخر الردود من البوت.',
                'status' => 'pending',
                'priority' => 'high'
            ]);

            SupportTicket::create([
                'tenant_id' => $tenant->id,
                'subject' => 'استفسار عن تفعيل باقة B2B',
                'description' => 'أريد معرفة كيفية شراء منتجات بالجملة.',
                'status' => 'open',
                'priority' => 'medium'
            ]);
            
            SupportTicket::create([
                'tenant_id' => $tenant->id,
                'subject' => 'طلب تغيير رابط الدومين',
                'description' => 'أرجو تغيير الرابط إلى اسم جديد.',
                'status' => 'resolved',
                'priority' => 'low'
            ]);
        }
    }
}
