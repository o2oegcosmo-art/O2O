<?php

use App\Models\User;
use App\Models\Booking;
use App\Models\Customer;
use App\Models\Tenant;
use App\Models\Service;
use Illuminate\Support\Facades\Auth;

require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// 🛡️ Enable Force Scoping in Console for this test
config(['tenant.force_scope_in_console' => true]);

echo "🕵️ Starting API Penetration Test: Cross-Tenant Isolation...\n";

// 1. Identify two different tenants
$tenant1_id = '019e2c51-87d5-7270-bfc4-3fb30b3d898e'; // RH Beauty
$tenant2_id = '00000000-0000-0000-0000-000000000000'; // Admin/System

// 2. Create a "Forbidden" record manually in Tenant 2
echo "🏗️ Creating forbidden record in Tenant 2 ($tenant2_id)...\n";
$customer = Customer::withoutTenant()->where('tenant_id', $tenant2_id)->first();
if (!$customer) {
    $customer = new Customer();
    $customer->tenant_id = $tenant2_id;
    $customer->name = 'Test Target';
    $customer->phone = '999999999';
    $customer->save();
}

$service = Service::withoutTenant()->where('tenant_id', $tenant2_id)->first() ?: Service::withoutTenant()->first();

$forbiddenBooking = new Booking();
$forbiddenBooking->tenant_id = $tenant2_id;
$forbiddenBooking->customer_id = $customer->id;
$forbiddenBooking->service_id = $service->id;
$forbiddenBooking->appointment_at = now();
$forbiddenBooking->status = 'pending';
$forbiddenBooking->price = 500;
$forbiddenBooking->save();

$forbidden_id = $forbiddenBooking->id;
echo "🎯 Target Forbidden ID: $forbidden_id (Tenant: $tenant2_id)\n";

// 3. Login as User from Tenant 1
$user1 = User::where('tenant_id', $tenant1_id)->first();
Auth::login($user1);
echo "👤 Logged in as User 1 (Tenant 1: $tenant1_id)\n";

// 4. ATTACK A: Attempt to READ forbidden record via Model::find()
echo "🔓 ATTACK A: Attempting to READ forbidden record...\n";
$record = Booking::find($forbidden_id);

if ($record) {
    echo "❌ CRITICAL VULNERABILITY: User 1 accessed Tenant 2's data!\n";
} else {
    echo "✅ SUCCESS: Record is invisible to User 1.\n";
}

// 5. ATTACK B: Attempt to UPDATE forbidden record via Model::where()->update()
echo "🔓 ATTACK B: Attempting to UPDATE forbidden record...\n";
$updated = Booking::where('id', $forbidden_id)->update(['status' => 'cancelled']);
if ($updated > 0) {
    echo "❌ CRITICAL VULNERABILITY: User 1 updated Tenant 2's data!\n";
} else {
    echo "✅ SUCCESS: Update failed (Record not found in scope).\n";
}

// 6. ATTACK C: Attempt to bypass via IDOR style findOrFail
echo "🔓 ATTACK C: Attempting IDOR via findOrFail...\n";
try {
    Booking::findOrFail($forbidden_id);
    echo "❌ CRITICAL VULNERABILITY: findOrFail bypassed isolation!\n";
} catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
    echo "✅ SUCCESS: findOrFail threw ModelNotFoundException as expected.\n";
}

// 7. Cleanup
$forbiddenBooking->delete();
echo "🏁 Penetration Test Complete.\n";
