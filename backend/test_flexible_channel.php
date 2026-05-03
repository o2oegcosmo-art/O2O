<?php

use App\Models\Customer;
use App\Models\Booking;
use App\Notifications\TestSimpleTextNotification;
use App\Notifications\BookingStatusNotification;
use Illuminate\Support\Facades\Notification;

// تشغيل بيئة لارافيل
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "🚀 بدء اختبار القناة المرنة (Flexible WhatsApp Channel)...\n";

$customer = Customer::first();
if (!$customer) {
    echo "❌ لا يوجد عملاء في القاعدة للاختبار. يرجى إضافة عميل أولاً.\n";
    exit;
}

echo "👤 العميل المختار للاختبار: " . $customer->name . " (" . $customer->phone . ")\n";

try {
    // 1. اختبار إرسال نص عادي (الميزة الجديدة)
    echo "1️⃣ جاري إرسال رسالة نصية بسيطة (Plain Text)... ";
    $customer->notifyNow(new TestSimpleTextNotification("مرحباً " . $customer->name . "! هذه رسالة تجريبية بسيطة للتأكد من مرونة النظام الجديد. ✨"));
    echo "✅ تم طلب الإرسال بنجاح.\n";
} catch (\Exception $e) {
    echo "❌ فشل اختبار النص: " . $e->getMessage() . "\n";
}

try {
    // 2. اختبار إرسال قالب رسمي
    $booking = $customer->bookings()->latest()->first();
    if ($booking) {
        echo "2️⃣ جاري إرسال قالب رسمي (Template) لحجز رقم " . $booking->id . "... ";
        $customer->notifyNow(new BookingStatusNotification($booking));
        echo "✅ تم طلب الإرسال بنجاح.\n";
    } else {
        echo "⚠️ لم يتم اختبار القالب لعدم وجود حجوزات لهذا العميل.\n";
    }
} catch (\Exception $e) {
    echo "❌ فشل اختبار القالب: " . $e->getMessage() . "\n";
}

try {
    // 3. اختبار إرسال وسائط (صورة مع رفع تلقائي)
    $imagePath = 'C:\Users\Goodm\.gemini\antigravity\brain\e50df428-f9a6-40c7-83ac-0ac02e983260\test_success_badge_1777030247064.png';
    echo "3️⃣ جاري إرسال صورة مع رفع تلقائي (Media Upload)... ";
    $customer->notifyNow(new App\Notifications\TestMediaNotification($imagePath));
    echo "✅ تم طلب الإرسال بنجاح.\n";
} catch (\Exception $e) {
    echo "❌ فشل اختبار الوسائط: " . $e->getMessage() . "\n";
}

echo "\n🏁 انتهى الاختبار. يرجى التحقق من هاتف العميل أو ملف الـ logs/laravel.log للتأكد من النتيجة.\n";
