<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

use App\Models\User;
use App\Models\AffiliateProfile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$tenantId = '00000000-0000-0000-0000-000000000000'; // Management Hub

// 1. Create User
$user = User::create([
    'id' => (string) Str::uuid(),
    'tenant_id' => $tenantId,
    'name' => 'مسوق تجريبي',
    'phone' => '01012345678',
    'email' => 'affiliate2@test.com',
    'password' => Hash::make('12345678'),
    'role' => 'affiliate'
]);

// 2. Create Affiliate Profile
AffiliateProfile::create([
    'id' => (string) Str::uuid(),
    'user_id' => $user->id,
    'promo_code' => 'TEST2026',
    'commission_percentage' => 15.00,
    'balance' => 0.00,
    'total_earned' => 0.00,
    'status' => 'active'
]);

echo "SUCCESS: Affiliate account created!\n";
echo "Phone: 01234567890\n";
echo "Password: 12345678\n";
echo "Promo Code: TEST2026\n";
