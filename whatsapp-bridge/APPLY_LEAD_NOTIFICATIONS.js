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
    console.log('✅ Connected for Lead Notifications Patch...');
    
    const phpPatch = `<?php
$filePath = '/var/www/o2oeg/backend/app/Http/Controllers/Api/LeadController.php';
$content = file_get_contents($filePath);

// 1. Add missing imports
if (strpos($content, 'use App\\Services\\WhatsAppService;') === false) {
    $content = str_replace('use Illuminate\\Support\\Facades\\DB;', "use Illuminate\\Support\\Facades\\DB;\nuse App\\Services\\WhatsAppService;\nuse Illuminate\\Support\\Str;", $content);
}

// 2. Patch store method
$oldStore = <<<'CODE'
        $lead = Lead::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Lead captured successfully!',
            'data' => $lead
        ], 201);
CODE;

$newStore = <<<'CODE'
        $lead = Lead::create($request->all());

        // 🔔 تنبيه الإدارة العليا بمهتم جديد
        try {
            $whatsapp = new WhatsAppService();
            $adminPhone = '01044167626';
            $message = "🆕 *مهتم جديد من الموقع* 🆕\n\n" .
                       "👤 الاسم: {$lead->name}\n" .
                       "💅 النشاط: {$lead->business_name} ({$lead->business_type})\n" .
                       "📞 الموبايل: {$lead->phone}\n" .
                       "📍 المحافظة: {$lead->governorate}\n" .
                       "💬 الرسالة: " . ($lead->message ?? 'لا يوجد');
            $whatsapp->sendMessage($adminPhone, $message, '00000000-0000-0000-0000-000000000000');
        } catch (\Exception $e) {}

        return response()->json([
            'success' => true,
            'message' => 'Lead captured successfully!',
            'data' => $lead
        ], 201);
CODE;

// 3. Patch storeFacebookLead method
$oldFB = <<<'CODE'
        \Log::info("[FB_LEAD] New lead captured from Facebook: " . $lead->name);

        return response()->json([
            'success' => true,
            'message' => 'Lead captured successfully from Facebook!',
            'lead_id' => $lead->id
        ], 201);
CODE;

$newFB = <<<'CODE'
        \Log::info("[FB_LEAD] New lead captured from Facebook: " . $lead->name);

        // 🔔 تنبيه الإدارة العليا بمهتم من فيسبوك
        try {
            $whatsapp = new WhatsAppService();
            $adminPhone = '01044167626';
            $message = "🔵 *مهتم جديد من فيسبوك* 🔵\n\n" .
                       "👤 الاسم: {$lead->name}\n" .
                       "📞 الموبايل: {$lead->phone}\n" .
                       "📧 البريد: {$lead->email}\n" .
                       "💡 الاهتمام: {$lead->interest_type}";
            $whatsapp->sendMessage($adminPhone, $message, '00000000-0000-0000-0000-000000000000');
        } catch (\Exception $e) {}

        return response()->json([
            'success' => true,
            'message' => 'Lead captured successfully from Facebook!',
            'lead_id' => $lead->id
        ], 201);
CODE;

if (strpos($content, 'تنبيه الإدارة العليا') === false) {
    $content = str_replace($oldStore, $newStore, $content);
    $content = str_replace($oldFB, $newFB, $content);
    file_put_contents($filePath, $content);
    echo "SUCCESS";
} else {
    echo "ALREADY_PATCHED";
}
?>`;

    const base64Script = Buffer.from(phpPatch).toString('base64');
    const cmd = `echo "${base64Script}" | base64 -d > /tmp/patch_leads.php && php /tmp/patch_leads.php && rm /tmp/patch_leads.php`;

    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
            console.log('\n✅ Lead Notifications Patch Finished.');
            conn.end();
        });
    });
}).on('error', e => {
    console.error('❌ SSH Error:', e.message);
}).connect(config);
