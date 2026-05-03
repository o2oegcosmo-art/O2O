<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\Http;

$apiKey = 'AIzaSyD_-NmV4X23YeERExdi1GyzTvebwi71YWM';
$url = "https://generativelanguage.googleapis.com/v1beta/models?key=" . $apiKey;

$response = Http::withoutVerifying()->get($url);
echo $response->body();
