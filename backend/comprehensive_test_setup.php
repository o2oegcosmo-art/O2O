<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Lead;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Service;
use Illuminate\Support\Facades\Hash;

echo "🚀 المرحلة الأولى: تسجيل Lead جديد (صالون القمة)...\n";
$lead = Lead::updateOrCreate(
    ['phone' => '01099998888'],
    [
        'name' => 'صالون القمة',
        'governorate' => 'الإسكندرية',
        'interest_type' => 'salon',
        'message' => 'أريد تجربة المنصة بالكامل'
    ]
);
echo "✅ Lead تم تسجيله بنجاح.\n";

echo "🚀 المرحلة الثانية: تحويل الـ Lead إلى صالون نشط وتجهيز حسابه...\n";
$tenant = Tenant::updateOrCreate(
    ['domain' => 'alkemma.o2oeg.local'],
    [
        'name' => 'صالون القمة',
        'phone' => '01099998888',
        'status' => 'active',
        'address' => 'الإسكندرية، مصر'
    ]
);

$user = User::updateOrCreate(
    ['phone' => '01099998888'],
    [
        'tenant_id' => $tenant->id,
        'name' => 'مدير القمة',
        'password' => Hash::make('password123'),
        'role' => 'tenant'
    ]
);
echo "✅ صالون القمة أصبح مسجلاً كـ Tenant الآن.\n";

echo "🚀 المرحلة الثالثة: التحقق من وجود الخدمات الأساسية...\n";
$bookingService = Service::where('slug', 'booking')->first();
$aiService = Service::where('slug', 'ai-receptionist')->first();

if ($bookingService && $aiService) {
    echo "✅ الخدمات الأساسية موجودة في النظام.\n";
} else {
    echo "❌ خطأ: الخدمات الأساسية غير موجودة، يرجى تشغيل الـ Seeders.\n";
}

echo "🎯 تم تجهيز 'صالون القمة' للاختبار الحي عبر المتصفح.\n";
echo "بيانات الدخول:\nالهاتف: 01099998888\nكلمة المرور: password123\n";
