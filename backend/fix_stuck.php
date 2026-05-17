<?php

define('LARAVEL_START', microtime(true));
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

use App\Models\Tenant;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Service;

echo "🚀 Starting Data Repair Mission...\n";

$tenants = Tenant::doesntHave('activeSubscription')->get();
echo "Found " . $tenants->count() . " stuck salons.\n";

foreach($tenants as $t) {
    echo "Fixing: " . $t->name . " (ID: " . $t->id . ")\n";
    
    // 1. Create Free Subscription
    $freePlan = Plan::where('slug', 'free')->first();
    if ($freePlan) {
        Subscription::updateOrCreate(
            ['tenant_id' => $t->id, 'status' => 'active'],
            [
                'plan_id' => $freePlan->id,
                'starts_at' => now(),
                'ends_at' => now()->addYears(10),
            ]
        );
        echo " - Subscription created.\n";
    }
    
    // 2. Activate Core Services
    $coreServices = Service::whereIn('slug', [
        'smart-booking-system',
        'crm-system',
        'public-page',
        'e-commerce'
    ])->get();
    
    foreach ($coreServices as $service) {
        if (!$t->services()->where('service_id', $service->id)->exists()) {
            $t->services()->attach($service->id, ['status' => 'active', 'activated_at' => now()]);
        }
    }
    echo " - Core services activated.\n";
    
    // 3. Mark Onboarding as Completed
    $t->onboarding_completed = true;
    $t->save();
    echo " - Onboarding marked as completed.\n";
}

echo "\n✅ MISSION ACCOMPLISHED!\n";
