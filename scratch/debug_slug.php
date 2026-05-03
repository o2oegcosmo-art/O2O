<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Service;
use App\Models\Tenant;

try {
    $tenant = Tenant::first() ?: Tenant::create(['name' => 'Test', 'domain' => 'test.local']);
    $service = Service::create([
        'tenant_id' => $tenant->id,
        'name' => 'Test Service',
        // 'slug' => 'test-service', // Intentionally omitting to test boot method
        'target_audience' => 'salon',
    ]);
    echo "Service created with slug: " . $service->slug . "\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
