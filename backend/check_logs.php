<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\WillAiLog;
use App\Models\Tenant;

$logs = WillAiLog::latest()->take(10)->get();

echo "--- RECENT AI LOGS ---\n";
foreach ($logs as $log) {
    $tenantName = Tenant::find($log->tenant_id)?->name ?? 'Unknown';
    echo "ID: {$log->id} | Tenant: {$tenantName} | Provider: {$log->provider} | Status: {$log->status}\n";
    echo "Response Snippet: " . substr($log->response, 0, 150) . "...\n";
    echo "----------------------------\n";
}
