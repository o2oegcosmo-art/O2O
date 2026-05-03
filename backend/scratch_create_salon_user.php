<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$tenant = \App\Models\Tenant::where('name', 'O2OEG Platform Admin')->first();
\App\Models\User::updateOrCreate(
    ['phone' => '01111111111'],
    [
        'tenant_id' => $tenant->id,
        'name' => 'Salon Manager',
        'password' => \Illuminate\Support\Facades\Hash::make('password123'),
        'role' => 'tenant'
    ]
);
echo '✅ User Created';
