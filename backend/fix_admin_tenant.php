<?php

use App\Models\Tenant;
use App\Models\Service;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$tenantId = "00000000-0000-0000-0000-000000000000"; // Admin Tenant
$tenant = Tenant::find($tenantId);

if ($tenant) {
    echo "Linking services for " . $tenant->name . " (Admin Tenant)...\n";
    $services = Service::all();
    foreach ($services as $s) {
        $tenant->services()->syncWithoutDetaching([$s->id => [
            'status' => 'active',
            'activated_at' => now()
        ]]);
        echo "  - Activated: " . $s->name . "\n";
    }
    echo "Done.\n";
} else {
    echo "Admin Tenant not found.\n";
}
