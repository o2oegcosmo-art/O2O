<?php

use App\Models\Tenant;
use App\Models\User;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$tenants = Tenant::with('users')->get();
foreach ($tenants as $t) {
    echo "Tenant: " . $t->name . " (ID: " . $t->id . ")\n";
    foreach ($t->users as $u) {
        echo "  - User: " . $u->name . " | Phone: " . $u->phone . " | Role: " . $u->role . "\n";
    }
}
