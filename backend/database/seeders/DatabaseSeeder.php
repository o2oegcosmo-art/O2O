<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            MahmoudWilliamSeeder::class,        // الإدارة العليا والخدمات الأساسية والباقات
            EgyptianSalonServicesSeeder::class, // قائمة الخدمات المصرية
            ArticleSeeder::class,               // المقالات والمحتوى
            EventSeeder::class,                 // الفعاليات والإعلانات
        ]);
    }
}
