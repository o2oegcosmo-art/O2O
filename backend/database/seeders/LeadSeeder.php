<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Lead;
use Illuminate\Support\Carbon;

class LeadSeeder extends Seeder
{
    public function run(): void
    {
        $interests = ['salon', 'company', 'affiliate'];
        $governorates = ['القاهرة', 'الجيزة', 'الإسكندرية', 'المنصورة'];

        for ($i = 0; $i < 25; $i++) {
            Lead::create([
                'name' => 'عميل تجريبي ' . ($i + 1),
                'phone' => '010' . rand(10000000, 99999999),
                'governorate' => $governorates[array_rand($governorates)],
                'interest_type' => $interests[array_rand($interests)],
                'message' => 'مهتم بتجربة المنصة',
                'created_at' => Carbon::now()->subDays(rand(0, 6))->subHours(rand(0, 23)),
            ]);
        }
    }
}
