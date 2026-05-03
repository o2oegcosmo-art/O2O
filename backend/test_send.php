<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\WhatsappMessage;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;

$msg = WhatsappMessage::latest()->first();
$tenant = $msg->tenant;
$phone = '201014380644';
$phoneNumberId = $tenant->whatsapp_phone_number_id ?: config('services.whatsapp.phone_number_id');
$token = $tenant->whatsapp_access_token ?: config('services.whatsapp.access_token');
$url = "https://graph.facebook.com/v21.0/{$phoneNumberId}/messages";

echo "Attempting to send to: $phone\n";
echo "URL: $url\n";

$response = Http::withToken($token)->post($url, [
    'messaging_product' => 'whatsapp',
    'to' => $phone,
    'type' => 'text',
    'text' => ['body' => $msg->message_text]
]);

echo "STATUS: " . $response->status() . "\n";
echo "BODY: " . $response->body() . "\n";
