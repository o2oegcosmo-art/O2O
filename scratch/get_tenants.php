<?php
require 'backend/vendor/autoload.php';
$app = require_once 'backend/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
$tenants = \App\Models\Tenant::take(2)->get();
foreach($tenants as $t) {
    echo $t->id . "\n";
}
