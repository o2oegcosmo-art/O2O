<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
use Illuminate\Support\Facades\DB;

DB::statement('SET FOREIGN_KEY_CHECKS=0;');
DB::table('messages')->truncate();
DB::table('will_ai_logs')->truncate();
DB::table('whatsapp_messages')->truncate();
DB::table('bookings')->truncate();
DB::statement('SET FOREIGN_KEY_CHECKS=1;');

echo "All chat history and bookings cleaned successfully!\n";
