<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Tenant;
use App\Models\Service;
use Illuminate\Support\Facades\Http;

// 1. تفعيل الخدمة للصالون
$tenant = Tenant::first();
$service = Service::where('slug', 'ai-receptionist')->first();

if ($service) {
    $tenant->services()->syncWithoutDetaching([$service->id => ['status' => 'active']]);
    echo "✅ AI Receptionist Activated for: " . $tenant->name . "\n";
}

// 2. محاكاة وصول رسالة واتساب باستخدام Phone ID الخاص بالصالون
$phoneId = $tenant->whatsapp_phone_number_id; // "987654321"

$payload = [
    'entry' => [
        [
            'changes' => [
                [
                    'value' => [
                        'messaging_product' => 'whatsapp',
                        'metadata' => [
                            'display_phone_number' => '1234567890',
                            'phone_number_id' => $phoneId
                        ],
                        'messages' => [
                            [
                                'from' => '201012345678',
                                'id' => 'wamid.HBgLMjAxMTE0NTY0OTUyFQIAERgSRDg2RDlERTE4RkY3NzBDNzg0AA==',
                                'timestamp' => time(),
                                'text' => [
                                    'body' => 'صباح الخير، عايزة أحجز ميعاد بروتين بكرة الساعة 5 مساءً'
                                ],
                                'type' => 'text'
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]
];

echo "🚀 Processing Simulated Webhook Logic for Phone ID: $phoneId ...\n";

// إنشاء طلب (Request) يدوي للمحاكاة
$request = Illuminate\Http\Request::create('/api/webhooks/whatsapp', 'POST', $payload);

// استدعاء الكونترولر مباشرة
$controller = new \App\Http\Controllers\Api\AIController();
$response = $controller->whatsappWebhook($request);

echo "📡 Response Status: " . $response->getStatusCode() . "\n";
echo "📦 Response Body: \n";
print_r($response->getData());
echo "\n--- End of Simulation ---\n";
