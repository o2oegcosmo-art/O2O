<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\WhatsappMessage;

$msg = WhatsappMessage::with('customer')->latest()->first();

if ($msg && $msg->customer) {
    echo "اسم العميل: " . $msg->customer->name . "\n";
    echo "رقم الهاتف: " . $msg->customer->phone . "\n";
    echo "حالة الإرسال: " . $msg->status . "\n";
    echo "محتوى الرسالة: " . $msg->message_text . "\n";
} else {
    echo "لا توجد رسائل مسجلة.\n";
}
