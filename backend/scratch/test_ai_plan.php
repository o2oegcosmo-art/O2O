<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

use App\Models\Tenant;
use App\Services\AIContentStudioService;

$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$tenant = Tenant::where('phone', '01122334455')->first();
$aiService = $app->make(AIContentStudioService::class);

try {
    echo "Generating weekly plan for: " . $tenant->name . "...\n";
    $calendar = $aiService->generateWeeklyPlan($tenant);
    echo "SUCCESS! Weekly plan generated with " . $calendar->posts->count() . " ideas.\n";
    
    foreach ($calendar->posts as $post) {
        echo "- Day: " . $post->title . " (" . $post->platform . ")\n";
    }
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
