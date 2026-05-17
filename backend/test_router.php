<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Services\AIRouterService;
use App\Models\Tenant;

$router = app(AIRouterService::class);
$tenant = Tenant::first();

echo "Testing AI Router...\n";
$result = $router->route("Hello, give me a business tip for a salon in JSON.", $tenant, 'test', true);

print_r($result);
