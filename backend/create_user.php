<?php
$t = App\Models\Tenant::first();
App\Models\User::create([
    'name' => 'مدير الصالون',
    'email' => 'salon@o2oeg.com',
    'phone' => '01111111111',
    'password' => Illuminate\Support\Facades\Hash::make('password123'),
    'tenant_id' => $t->id
]);
echo "User created successfully.\n";
