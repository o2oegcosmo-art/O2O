<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Tenant;
use App\Models\Service;

try {
    $tenant = Tenant::where('domain', 'admin.o2oeg.local')->first();
    if ($tenant) {
        $services = [
            ['name' => 'قص شعر وتصفيف', 'price' => 200, 'description' => 'قص شعر مع تصفيف احترافي', 'target_audience' => 'salon'],
            ['name' => 'تنظيف بشرة عميق', 'price' => 350, 'description' => 'تنظيف بشرة باستخدام أفضل المنتجات', 'target_audience' => 'salon'],
            ['name' => 'صبغة شعر كاملة', 'price' => 500, 'description' => 'صبغة شعر بألوان عصرية', 'target_audience' => 'salon'],
        ];

        foreach ($services as $serviceData) {
            Service::firstOrCreate(
                ['tenant_id' => $tenant->id, 'name' => $serviceData['name']],
                [
                    'price' => $serviceData['price'],
                    'description' => $serviceData['description'],
                    'target_audience' => $serviceData['target_audience'],
                    'status' => 'active',
                    'pricing_type' => 'free', // Just for testing
                ]
            );
        }
        echo "Sample salon services added successfully!\n";
    } else {
        echo "Admin tenant not found.\n";
    }
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
