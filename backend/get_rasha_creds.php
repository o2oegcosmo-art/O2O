<?php

use App\Models\Tenant;
use App\Models\User;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$tenantName = "رشا حمدي";
$tenant = Tenant::where('name', 'like', "%$tenantName%")->first();

if ($tenant) {
    echo "Tenant: " . $tenant->name . "\n";
    $user = User::where('tenant_id', $tenant->id)->first();
    if ($user) {
        echo "User: " . $user->name . "\n";
        echo "Phone: " . $user->phone . "\n";
        // Password cannot be retrieved as it is hashed.
    }
} else {
    echo "Tenant not found.\n";
}
