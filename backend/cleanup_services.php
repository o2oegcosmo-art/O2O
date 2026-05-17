<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Service;

echo "Cleaning up tenant-specific services...\n";
$deletedCount = Service::whereNotNull('tenant_id')->delete();
echo "Deleted $deletedCount services.\n";

echo "\nGlobal Services (Platform Templates):\n";
$globals = Service::whereNull('tenant_id')->get();
foreach ($globals as $s) {
    echo "  - " . $s->name . " (Audience: " . $s->target_audience . ")\n";
}
