const { Client } = require('ssh2');

const config = {
  host: '72.62.182.106',
  port: 22,
  username: 'root',
  password: 'O2OEG_Secure_Shield_2026_#646',
  readyTimeout: 30000
};

const conn = new Client();
conn.on('ready', () => {
    console.log('✅ Connected for Notifications Patch...');
    
    // Using a PHP script to perform the replacement to ensure it is done correctly within the environment
    const phpPatch = `<?php
$filePath = '/var/www/o2oeg/backend/app/Http/Controllers/Api/AuthController.php';
$content = file_get_contents($filePath);

$oldCode = <<<'CODE'
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'access_token' => $token,
                'token_type' => 'Bearer',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'phone' => $user->phone,
                    'role' => $user->role,
                    'business_category' => $tenant->business_category,
                ],
                'message' => 'تم إنشاء الحساب وتفعيل الباقة المجانية بنجاح!'
            ], 201);
CODE;

$newCode = <<<'CODE'
            $token = $user->createToken('auth_token')->plainTextToken;

            // 🟢 نظام التنبيهات السيادية (Admin & Salon Welcome)
            try {
                $whatsapp = new \App\Services\WhatsAppService();
                $systemSessionId = '00000000-0000-0000-0000-000000000000'; 
                
                // 1. تنبيه صاحب المشروع (محمود وليم)
                $adminPhone = '01044167626';
                $adminMessage = "🔔 *تنبيه انضمام صالون جديد* 🔔\n\n" .
                               "👤 الاسم: {$user->name}\n" .
                               "📞 الموبايل: {$user->phone}\n" .
                               "💅 الصالون: {$tenant->name}\n" .
                               "📅 التاريخ: " . now()->format('Y-m-d H:i');
                $whatsapp->sendMessage($adminPhone, $adminMessage, $systemSessionId);

                // 2. رسالة الترحيب للصالون الجديد
                $welcomeMessage = "مرحباً بكِ في عائلة *O2OEG*! ✨\n\n" .
                                 "يا {$user->name}، تم تفعيل لوحة تحكم صالون *({$tenant->name})* بنجاح.\n\n" .
                                 "🚀 يمكنكِ الآن البدء في إدارة الحجوزات والعملاء.\n" .
                                 "🔗 رابط الدخول: https://o2oeg.com/login\n" .
                                 "🔑 سجلي الدخول برقم موبايلك وكلمة المرور التي اخترتيها.\n\n" .
                                 "فريق O2O جاهز لدعمكِ دائماً! 💪";
                $whatsapp->sendMessage($user->phone, $welcomeMessage, $systemSessionId);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("Registration Notifications Failed: " . $e->getMessage());
            }

            return response()->json([
                'access_token' => $token,
                'token_type' => 'Bearer',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'phone' => $user->phone,
                    'role' => $user->role,
                    'business_category' => $tenant->business_category,
                ],
                'message' => 'تم إنشاء الحساب وتفعيل الباقة المجانية بنجاح!'
            ], 201);
CODE;

if (strpos($content, 'نظام التنبيهات السيادية') !== false) {
    echo "ALREADY_PATCHED";
    exit;
}

$newContent = str_replace($oldCode, $newCode, $content);

if ($newContent !== $content) {
    file_put_contents($filePath, $newContent);
    echo "SUCCESS";
} else {
    echo "FAILED_MATCH";
}
?>`;

    const base64Script = Buffer.from(phpPatch).toString('base64');
    const cmd = `echo "${base64Script}" | base64 -d > /tmp/patch_auth.php && php /tmp/patch_auth.php && rm /tmp/patch_auth.php`;

    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
            console.log('\n✅ Patch Process Finished.');
            conn.end();
        });
    });
}).on('error', e => {
    console.error('❌ SSH Error:', e.message);
}).connect(config);
