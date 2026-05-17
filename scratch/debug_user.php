<?php
require 'backend/vendor/autoload.php';
$app = require 'backend/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
$u = \App\Models\User::where('tenant_id', '019e2c51-87d5-7270-bfc4-3fb30b3d898e')->first();
echo "Role: " . $u->role . "\n";
echo "Tenant: " . $u->tenant_id . "\n";
