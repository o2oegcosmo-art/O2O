<?php

use App\Models\Tenant;
use App\Models\Service;
use Illuminate\Support\Facades\DB;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$tenantName = "رشا حمدي";
$tenant = Tenant::where('name', 'like', "%$tenantName%")->first();

if (!$tenant) {
    echo "Tenant '$tenantName' not found.\n";
    // List all tenants to help find the right one
    echo "Existing Tenants:\n";
    Tenant::all()->each(function($t) { echo "- " . $t->name . " (ID: " . $t->id . ")\n"; });
    exit;
}

echo "Found Tenant: " . $tenant->name . " (ID: " . $tenant->id . ")\n";
echo "Active Subscription: " . ($tenant->activeSubscription ? $tenant->activeSubscription->plan->name : "None") . "\n";
echo "Services in DB (tenant_service table):\n";

$services = DB::table('tenant_service')
    ->join('services', 'tenant_service.service_id', '=', 'services.id')
    ->where('tenant_service.tenant_id', $tenant->id)
    ->select('services.name', 'services.slug', 'tenant_service.status')
    ->get();

if ($services->isEmpty()) {
    echo "No services found for this tenant in tenant_service table.\n";
} else {
    foreach ($services as $s) {
        echo "- " . $s->name . " (Slug: " . $s->slug . ") | Status: " . $s->status . "\n";
    }
}

echo "\nAll Available Sovereign Services (slugs):\n";
Service::whereNull('tenant_id')->get()->each(function($s) {
    echo "- " . $s->name . " (Slug: " . $s->slug . ")\n";
});
