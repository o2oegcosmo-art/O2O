<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
use Illuminate\Support\Facades\DB;

$services = DB::table('services')->get();
foreach ($services as $s) {
    echo $s->id . " | " . $s->name . " | Tenant: " . ($s->tenant_id ?? 'NULL') . "\n";
}
