<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Http\Request;
use App\Http\Controllers\Api\AIController;

try {
    $request = Request::create('/api/webhooks/whatsapp', 'POST', [
        'Body' => 'أريد حجز موعد لقص الشعر غداً',
        'From' => 'whatsapp:+201012345678',
        'To' => 'whatsapp:+201000000000' // افترض أن هذا رقم الصالون المربوط
    ]);

    $controller = new AIController();
    $response = $controller->whatsappWebhook($request);

    echo "Webhook Response:\n";
    echo $response->getContent() . "\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
