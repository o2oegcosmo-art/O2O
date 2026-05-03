<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Service;
use App\Models\Tenant;

echo "--- GLOBAL SERVICES (Platform) ---\n";
$globals = Service::whereNull('tenant_id')->get();
foreach ($globals as $s) {
    echo "ID: " . $s->id . " | Name: " . $s->name . " | Slug: " . $s->slug . "\n";
}

echo "\n--- TENANT SERVICES ---\n";
$tenants = Tenant::all();
foreach ($tenants as $t) {
    echo "Tenant: " . $t->name . " (ID: " . $t->id . ")\n";
    
    // Check services with tenant_id set to this tenant
    $owned = Service::where('tenant_id', $t->id)->get();
    echo "Owned Services (in services table): " . $owned->count() . "\n";
    foreach ($owned as $s) {
        echo "  - " . $s->name . " (Slug: " . $s->slug . ")\n";
    }

    // Check platform services activated via tenant_service
    $activated = $t->services; // this uses the belongsToMany relationship
    echo "Activated Platform Services (in tenant_service table): " . $activated->count() . "\n";
    foreach ($activated as $s) {
        echo "  - " . $s->name . "\n";
    }
    echo "-------------------\n";
}
