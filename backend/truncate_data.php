<?php
use Illuminate\Support\Facades\DB;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Starting truncation...\n";
DB::statement('SET FOREIGN_KEY_CHECKS=0;');
DB::table('messages')->truncate();
DB::table('will_ai_logs')->truncate();
DB::table('whatsapp_messages')->truncate();
DB::statement('SET FOREIGN_KEY_CHECKS=1;');
echo "Cleanup COMPLETE!\n";
