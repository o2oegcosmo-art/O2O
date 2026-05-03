<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;

$oldName = "L'Oreal Professionnel EG";
$newName = "7Days pro";

$tenant = Tenant::where('name', $oldName)->first();

if ($tenant) {
    echo "Found Tenant: " . $tenant->name . " (ID: " . $tenant->id . ")\n";
    
    DB::beginTransaction();
    try {
        // Delete the tenant (this should handle cascading if set up, but let's be safe)
        // Usually, users associated with the tenant might need to be handled.
        
        // Hard delete the tenant
        $tenant->delete();
        echo "Deleted old tenant: $oldName\n";
        
        // Create the new tenant
        $newTenant = Tenant::create([
            'name' => $newName,
            'domain' => '7dayspro', // suggested domain
            'status' => 'active',
            'business_category' => 'company'
        ]);
        
        echo "Created new tenant: $newName (ID: " . $newTenant->id . ")\n";
        
        DB::commit();
        echo "Transaction successful.\n";
    } catch (\Exception $e) {
        DB::rollBack();
        echo "Error: " . $e->getMessage() . "\n";
    }
} else {
    echo "Tenant '$oldName' not found. Creating '$newName' directly.\n";
    Tenant::create([
        'name' => $newName,
        'domain' => '7dayspro',
        'status' => 'active',
        'business_category' => 'company'
    ]);
    echo "Created new tenant: $newName\n";
}
