<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Service;
use App\Models\Tenant;

$adminTenant = Tenant::where('name', 'O2OEG Platform Admin')->first();
$rashaTenant = Tenant::where('name', 'صالون رشا حمدي')->first();

if ($adminTenant && $rashaTenant) {
    // Get services belonging to Rasha Hamdi (the beauty services)
    $services = Service::where('tenant_id', $rashaTenant->id)->get();
    
    echo "Found " . $services->count() . " services to copy...\n";
    
    foreach ($services as $s) {
        // Check if already exists for admin to avoid duplicates
        $exists = Service::where('tenant_id', $adminTenant->id)->where('name', $s->name)->exists();
        if (!$exists) {
            $newS = $s->replicate();
            $newS->tenant_id = $adminTenant->id;
            $newS->slug = \Illuminate\Support\Str::slug($s->name) . '-' . substr($adminTenant->id, 0, 8);
            $newS->save();
            echo "Copied: " . $s->name . "\n";
        } else {
            echo "Already exists: " . $s->name . "\n";
        }
    }
    echo "Done!\n";
} else {
    echo "Tenants not found. Admin: " . ($adminTenant ? 'Found' : 'MISSING') . " | Rasha: " . ($rashaTenant ? 'Found' : 'MISSING') . "\n";
}
