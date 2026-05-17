<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
Illuminate\Support\Facades\Schema::dropIfExists('event_analytics');
Illuminate\Support\Facades\Schema::dropIfExists('events');
echo "Dropped\n";
