<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Tenant;

echo "--- Platform Subscription Audit ---\n";
$tenants = Tenant::with(['activeSubscription.plan', 'services'])->get();

foreach ($tenants as $t) {
    echo "Tenant: " . $t->name . "\n";
    echo "Plan: " . ($t->activeSubscription->plan->name ?? 'NO ACTIVE PLAN') . "\n";
    echo "Active Services:\n";
    foreach ($t->services as $s) {
        echo " - " . $s->slug . " (" . $s->name . ")\n";
    }
    echo "-----------------------------------\n";
}
