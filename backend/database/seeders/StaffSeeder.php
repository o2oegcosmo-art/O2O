<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\Staff;
use Illuminate\Database\Seeder;

class StaffSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tenant = Tenant::first();

        if ($tenant) {
            $staffMembers = [
                [
                    'name' => 'أحمد علي',
                    'specialization' => 'حلاق رجالي (Master)',
                    'phone' => '01011122233',
                    'is_active' => true,
                ],
                [
                    'name' => 'سارة محمود',
                    'specialization' => 'خبيرة تصفيف وصبغة',
                    'phone' => '01122233344',
                    'is_active' => true,
                ],
                [
                    'name' => 'ياسين حسن',
                    'specialization' => 'متخصص عناية بالبشرة',
                    'phone' => '01233344455',
                    'is_active' => false,
                ],
            ];

            foreach ($staffMembers as $member) {
                $tenant->staff()->create($member);
            }
        }
    }
}
