<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Tenant;
use App\Models\Service;

$tenant = Tenant::first();
echo "First Tenant: " . $tenant->name . "\n";
$services = $tenant->services()->wherePivot('status', 'active')->get();
echo "Active Services: " . $services->pluck('slug')->implode(', ') . "\n";

$aiService = Service::where('slug', 'ai-receptionist')->first();
if ($aiService) {
    echo "Activating AI for " . $tenant->name . "...\n";
    $tenant->services()->syncWithoutDetaching([$aiService->id => ['status' => 'active']]);
}
