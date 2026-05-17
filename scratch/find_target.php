<?php
require 'backend/vendor/autoload.php';
$app = require 'backend/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Booking;
use App\Models\Tenant;

$t1 = '019e2c51-87d5-7270-bfc4-3fb30b3d898e';
$t2 = '00000000-0000-0000-0000-000000000000';

$b2 = Booking::withoutGlobalScopes()->where('tenant_id', $t2)->first();
if (!$b2) {
    // Try to find ANY record not in T1
    $b2 = Booking::withoutGlobalScopes()->where('tenant_id', '!=', $t1)->first();
}

if ($b2) {
    echo "TARGET_ID:" . $b2->id . "\n";
    echo "TARGET_TENANT:" . $b2->tenant_id . "\n";
} else {
    echo "NO_RECORDS_FOUND\n";
}
