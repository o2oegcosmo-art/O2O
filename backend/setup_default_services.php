<?php
use App\Models\Tenant;
use App\Models\Service;
use Illuminate\Support\Str;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$tenantId = '019e02ab-2f55-72e9-8cc8-ad8bcb4cef6d'; // محمود
$tenant = Tenant::find($tenantId);

if (!$tenant) {
    die("Tenant not found\n");
}

// 1. Delete all non-platform services currently attached to this tenant to clean garbage
Service::where('tenant_id', $tenantId)->delete();

// 2. Define basic salon services
$basicServices = [
    ['name' => 'قص شعر (حريمي/رجالي)', 'price' => 100],
    ['name' => 'سشوار وبيبي ليس', 'price' => 150],
    ['name' => 'صبغة شعر كاملة', 'price' => 500],
    ['name' => 'تنظيف بشرة عميق', 'price' => 300],
    ['name' => 'باديكير ومانيكير كامل', 'price' => 200],
    ['name' => 'ميك اب سواريه', 'price' => 600],
    ['name' => 'حمام مغربي أصلي', 'price' => 450],
    ['name' => 'بروتين معالج للشعر', 'price' => 1200],
];

// 3. Insert them
foreach ($basicServices as $svc) {
    Service::create([
        'tenant_id' => $tenantId,
        'name' => $svc['name'],
        'slug' => Str::slug($svc['name']) . '-' . Str::random(5),
        'target_audience' => 'salon',
        'pricing_type' => 'free', // Assuming flat price or just free entry for simplicity, price is set below
        'price' => $svc['price'],
        'status' => 'active'
    ]);
}

echo "Cleaned up and inserted basic services for tenant: {$tenant->name}\n";
