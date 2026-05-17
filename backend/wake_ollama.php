<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- OLLAMA EMERGENCY RECOVERY ---\n";

// 1. Try to check if it's responding
try {
    $response = Illuminate\Support\Facades\Http::timeout(5)->get('http://127.0.0.1:11434/api/tags');
    if ($response->successful()) {
        echo "✅ Ollama is ALIVE and responding.\n";
        print_r($response->json());
    } else {
        echo "❌ Ollama is responding but with error: " . $response->status() . "\n";
    }
} catch (\Exception $e) {
    echo "⚠️ Ollama is NOT responding (127.0.0.1:11434). Attempting to wake it up...\n";
    
    // 2. Attempt to start it (This works if running on Linux server)
    if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
        echo "👉 Detection: Running on WINDOWS. Starting Ollama app...\n";
        exec('start /B ollama serve');
    } else {
        echo "👉 Detection: Running on LINUX. Starting Ollama service...\n";
        exec('nohup ollama serve > /dev/null 2>&1 &');
    }
    
    sleep(5);
    
    // 3. Re-check
    try {
        $response = Illuminate\Support\Facades\Http::timeout(5)->get('http://127.0.0.1:11434/api/tags');
        if ($response->successful()) {
            echo "✅ SUCCESS: Ollama has been woken up!\n";
        } else {
            echo "❌ STILL FAILING: Ollama started but not responding correctly.\n";
        }
    } catch (\Exception $e2) {
        echo "❌ CRITICAL: Could not wake up Ollama. It might not be installed or port is blocked.\n";
    }
}
