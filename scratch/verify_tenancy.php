<?php

use App\Models\User;
use App\Models\Customer;
use App\Models\Booking;
use Illuminate\Support\Facades\Auth;

require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "🧪 Starting Multi-Tenancy Security Verification...\n";

// 1. Setup Test Data (Using Real IDs)
$tenant1_id = '019e2c51-87d5-7270-bfc4-3fb30b3d898e'; // RH Beauty
$tenant2_id = '00000000-0000-0000-0000-000000000000'; // Admin

$user1 = User::where('tenant_id', $tenant1_id)->first();
if (!$user1) {
    echo "❌ Error: User for tenant 1 not found.\n";
    exit;
}

// 2. Simulate User 1 Login
Auth::login($user1);
echo "👤 Logged in as User 1 (Tenant: $tenant1_id)\n";

// 3. Test Automatic Filtering
$allCustomers = Customer::all();
$countOther = 0;
foreach($allCustomers as $c) {
    if ($c->tenant_id !== $tenant1_id) $countOther++;
}

echo "🔍 Total visible customers: " . count($allCustomers) . "\n";
echo "🔍 Count of leaked data (other tenants): $countOther\n";

if ($countOther > 0) {
    echo "❌ SECURITY BREACH: Cross-tenant data visible!\n";
} else {
    echo "✅ SUCCESS: Isolation Scope is active and working.\n";
}

// 4. Test Automatic Injection
echo "🏗️ Creating new customer without specifying tenant_id...\n";
$newCustomer = Customer::create(['name' => 'Auto Tenant Test ' . time(), 'phone' => '123456789']);

if ($newCustomer->tenant_id === $tenant1_id) {
    echo "✅ SUCCESS: tenant_id automatically injected: " . $newCustomer->tenant_id . "\n";
} else {
    echo "❌ FAILURE: tenant_id NOT injected automatically. Found: " . ($newCustomer->tenant_id ?? 'NULL') . "\n";
}

// 5. Cleanup
$newCustomer->delete();
echo "🧹 Verification Complete.\n";
