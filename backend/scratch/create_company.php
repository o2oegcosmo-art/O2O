<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

use App\Models\Tenant;
use App\Models\User;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Service;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$tenant = Tenant::create([
    'id' => (string) Str::uuid(),
    'name' => 'Vision Beauty Egypt',
    'domain' => 'vision-beauty.o2oeg.local',
    'phone' => '01122334455',
    'address' => 'التجمع الخامس، القاهرة',
    'status' => 'active',
    'business_category' => 'company',
    'has_full_access' => false
]);

$user = User::create([
    'tenant_id' => $tenant->id,
    'name' => 'مدير Vision Beauty',
    'phone' => '01122334455',
    'password' => Hash::make('password123'),
    'role' => 'tenant_admin'
]);

$plan = Plan::first();
if ($plan) {
    Subscription::create([
        'tenant_id' => $tenant->id,
        'plan_id' => $plan->id,
        'status' => 'active',
        'starts_at' => now(),
        'ends_at' => now()->addYear()
    ]);
}

$crmService = Service::where('slug', 'crm')->first();
if ($crmService) {
    $tenant->services()->attach($crmService->id, ['status' => 'active', 'activated_at' => now()]);
}

echo "SUCCESS: Company created with ID: " . $tenant->id . "\n";
