<?php

use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$tenantId = "019ded4c-e81a-7317-bb0a-ef3ba7e45616";
$tenant = Tenant::find($tenantId);

echo "Tenant: " . $tenant->name . "\n";
$services = DB::table('tenant_service')
    ->join('services', 'tenant_service.service_id', '=', 'services.id')
    ->where('tenant_service.tenant_id', $tenantId)
    ->select('services.name', 'services.slug', 'tenant_service.status')
    ->get();

foreach ($services as $s) {
    echo "- " . $s->name . " (Slug: " . $s->slug . ") | Status: " . $s->status . "\n";
}
