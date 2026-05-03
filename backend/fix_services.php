<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

echo "Modifying services table...\n";
try {
    Schema::table('services', function ($table) {
        $table->uuid('tenant_id')->nullable()->change();
    });
    echo "Success: tenant_id is now nullable.\n";
} catch (\Exception $e) {
    echo "Error modifying table: " . $e->getMessage() . "\n";
}

echo "Seeding platform services...\n";
try {
    DB::table('services')->whereNull('tenant_id')->delete();
    DB::table('services')->insert([
        ['id' => Str::uuid(), 'name' => 'نظام الحجز الذكي', 'slug' => 'ai-booking', 'target_audience' => 'salon', 'created_at' => now(), 'updated_at' => now()],
        ['id' => Str::uuid(), 'name' => 'نظام إدارة العملاء CRM', 'slug' => 'crm', 'target_audience' => 'company', 'created_at' => now(), 'updated_at' => now()],
        ['id' => Str::uuid(), 'name' => 'استشارات Will AI', 'slug' => 'will-ai', 'target_audience' => 'salon', 'created_at' => now(), 'updated_at' => now()],
        ['id' => Str::uuid(), 'name' => 'متجر التجزئة الإلكتروني', 'slug' => 'retail-store', 'target_audience' => 'salon', 'created_at' => now(), 'updated_at' => now()]
    ]);
    echo "Success: Platform services seeded.\n";
} catch (\Exception $e) {
    echo "Error seeding services: " . $e->getMessage() . "\n";
}
