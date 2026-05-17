<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$u = App\Models\User::where('name', 'محمود وليم')->first();
if ($u) {
    echo 'User: ' . $u->name . ' | Tenant: ' . $u->tenant->name . ' | Tenant ID: ' . $u->tenant->id . "\n";
} else {
    echo "User not found\n";
}
