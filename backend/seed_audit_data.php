<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Tenant;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Service;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

echo "🚀 Creating Test Accounts for Audit...\n";

// 1. Get Plans
$essentialPlan = Plan::where('slug', 'essential-salon')->first();
$proPlan = Plan::where('slug', 'pro-salon-ai')->first();

if (!$essentialPlan || !$proPlan) {
    echo "❌ Error: Plans not found. Run PlanSeeder first.\n";
    exit;
}

// 2. Create Salon A (Essential)
$salonA = Tenant::updateOrCreate(
    ['domain' => 'salona.o2oeg.com'],
    [
        'id' => (string) Str::uuid(),
        'name' => 'صالون التجربة الأساسي (Salon A)',
        'status' => 'active',
        'business_category' => 'salon',
        'onboarding_completed' => true
    ]
);

Subscription::updateOrCreate(
    ['tenant_id' => $salonA->id, 'status' => 'active'],
    [
        'plan_id' => $essentialPlan->id,
        'starts_at' => now(),
        'ends_at' => now()->addMonth(),
    ]
);

// Sync Essential Services
$essentialServices = Service::whereIn('slug', ['smart-booking-system', 'public-page'])->pluck('id');
$salonA->services()->sync($essentialServices);

User::updateOrCreate(
    ['email' => 'salona@test.com'],
    [
        'name' => 'مدير صالون أ',
        'phone' => '01011111111',
        'password' => Hash::make('123456'),
        'role' => 'owner',
        'tenant_id' => $salonA->id
    ]
);

// 3. Create Salon B (Pro AI)
$salonB = Tenant::updateOrCreate(
    ['domain' => 'salonb.o2oeg.com'],
    [
        'id' => (string) Str::uuid(),
        'name' => 'صالون التجربة الاحترافي (Salon B)',
        'status' => 'active',
        'business_category' => 'salon',
        'onboarding_completed' => true
    ]
);

Subscription::updateOrCreate(
    ['tenant_id' => $salonB->id, 'status' => 'active'],
    [
        'plan_id' => $proPlan->id,
        'starts_at' => now(),
        'ends_at' => now()->addMonth(),
    ]
);

// Sync Pro Services
$proServices = Service::whereIn('slug', ['smart-booking-system', 'crm-system', 'public-page', 'e-commerce'])->pluck('id');
$salonB->services()->sync($proServices);

User::updateOrCreate(
    ['email' => 'salonb@test.com'],
    [
        'name' => 'مدير صالون ب',
        'phone' => '01022222222',
        'password' => Hash::make('123456'),
        'role' => 'owner',
        'tenant_id' => $salonB->id
    ]
);

echo "✅ Test Accounts Created!\n";
echo "Salon A: salona@test.com / 123456 (Essential Plan)\n";
echo "Salon B: salonb@test.com / 123456 (Pro AI Plan)\n";
