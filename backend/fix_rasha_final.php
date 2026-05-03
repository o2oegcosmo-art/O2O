<?php

use App\Models\Tenant;
use App\Models\Service;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$tenantId = "019ded4c-e81a-7317-bb0a-ef3ba7e45616";
$tenant = Tenant::find($tenantId);

if ($tenant) {
    echo "Linking services for " . $tenant->name . "...\n";
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
    echo "Tenant not found.\n";
}
