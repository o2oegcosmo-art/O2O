<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Tenant;
use App\Models\Customer;
use App\Models\Booking;
use App\Models\Service;
use App\Models\Message;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Services\AISecurityService;
use App\Services\AIRouterService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;

class AIController extends Controller
{
    protected $security;
    protected $aiRouter;

    public function __construct(AISecurityService $security, AIRouterService $aiRouter)
    {
        $this->security = $security;
        $this->aiRouter = $aiRouter;
    }

    /**
     * التحقق من طلب Meta Webhook
     */
    public function verifyWebhook(Request $request)
    {
        $verifyToken = config('services.whatsapp.webhook_verify_token');
        $mode = $request->query('hub_mode');
        $token = $request->query('hub_verify_token');
        $challenge = $request->query('hub_challenge');

        if ($mode === 'subscribe' && $token === $verifyToken) {
            return response($challenge, 200);
        }
        return response('Forbidden', 403);
    }

    /**
     * معالجة رسائل واتساب الواردة
     */
    public function handleWebhook(Request $request)
    {
        if (config('app.env') === 'production') {
            $signature = $request->header('X-Hub-Signature-256');
            $bridgeKey = $request->header('X-Bridge-Key');
            $expectedBridgeKey = env('BRIDGE_API_KEY', 'o2oeg_bridge_secret_2026_z8v9');

            // Allow our local bridge to bypass Meta signature
            if ($bridgeKey && $bridgeKey === $expectedBridgeKey) {
                // Verified bridge request
            } else {
                $appSecret = config('services.whatsapp.app_secret');
                if ($signature && $appSecret) {
                    $expected = 'sha256=' . hash_hmac('sha256', $request->getContent(), $appSecret);
                    if (!hash_equals($expected, $signature)) return response()->json(['error' => 'Invalid signature'], 403);
                } else {
                    return response()->json(['error' => 'Missing signature'], 403);
                }
            }
        }

        $bridgeTenantId = $request->input('tenant_id');
        $entry = $request->input('entry.0.changes.0.value');
        if (!$entry || !isset($entry['messages'][0])) return response()->json(['success' => false]);

        $messageObj = $entry['messages'][0];
        $from = $messageObj['from'];
        $toPhone = $entry['metadata']['display_phone_number'] ?? '';
        $phoneNumberId = $entry['metadata']['phone_number_id'] ?? 'unofficial';

        $tenant = $bridgeTenantId ? Tenant::find($bridgeTenantId) : Tenant::where('whatsapp_phone_number_id', $phoneNumberId)->first();
        if (!$tenant) $tenant = Tenant::where('whatsapp_number', $toPhone)->first();
        if (!$tenant) return response()->json(['success' => false, 'message' => 'Tenant not found']);

        $messageType = $messageObj['type'] ?? 'text';
        $incomingMessage = '';

        if ($messageType === 'text') {
            $incomingMessage = $this->security->sanitizeInboundMessage($messageObj['text']['body'] ?? '');
        } elseif ($messageType === 'audio') {
            $audioBase64 = $messageObj['audio']['base64'] ?? null;
            $audioId = $messageObj['audio']['id'] ?? null;
            $incomingMessage = $audioBase64 ? $this->transcribeBase64Audio($audioBase64) : $this->transcribeAudioFromMeta($audioId, $tenant->whatsapp_access_token);
        }

        if (empty($incomingMessage)) $incomingMessage = "(رسالة مجهولة)";

        $hasAiFeature = $tenant->services()->whereIn('slug', ['smart-booking-system', 'crm-system'])->wherePivot('status', 'active')->exists();
        if (!$hasAiFeature && config('app.env') !== 'local') return response()->json(['success' => false, 'message' => 'AI feature not active']);

        $usageService = app(\App\Services\AIUsageService::class);
        if (!$usageService->canUseAI($tenant) && config('app.env') !== 'local') return response()->json(['success' => false, 'message' => 'AI limit reached']);

        Message::create([
            'tenant_id' => $tenant->id,
            'sender_phone' => $from,
            'receiver_phone' => $toPhone,
            'message_body' => $incomingMessage,
            'direction' => 'inbound',
        ]);

        $senderName = $entry['contacts'][0]['profile']['name'] ?? 'عميل جديد';
        
        // استخلاص الرقم الحقيقي للعميل (بدون @lid أو @s.whatsapp.net) لكي يُحفظ في قاعدة البيانات بشكل سليم
        $realPhone = preg_replace('/[^0-9]/', '', $from);
        
        \App\Jobs\ProcessAIWhatsAppMessage::dispatch($tenant, $from, $incomingMessage, $phoneNumberId, $senderName, $realPhone);

        return response()->json(['success' => true]);
    }

    /**
     * معالجة الرسالة باستخدام AI - نظام الـ Multi-Brain المتطور
     */
    public function processMessageWithAI($tenant, $phone, $message)
    {
        $now = Carbon::now('Africa/Cairo');
        $daysMap = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        $todayName = $daysMap[$now->dayOfWeek];
        
        // جدول أيام الأسبوع القادم مع التواريخ الصريحة
        $calendarReference = "--- جدول التواريخ (اليوم: {$todayName} {$now->format('Y-m-d')}) ---\n";
        for ($i = 0; $i < 7; $i++) {
            $date = $now->copy()->addDays($i);
            $label = $i === 0 ? 'اليوم' : ($i === 1 ? 'غداً' : $daysMap[$date->dayOfWeek]);
            $calendarReference .= "- {$label}: " . $date->format('Y-m-d') . "\n";
        }

        $workingHours = DB::table('working_hours')->where('tenant_id', $tenant->id)->whereNull('staff_id')->get()
            ->map(fn($h) => "- " . ($daysMap[$h->day_of_week] ?? 'يوم') . ": من {$h->start_time} إلى {$h->end_time}")->implode("\n");

        $services = Service::where('tenant_id', $tenant->id)->get()
            ->map(fn($s) => "- {$s->name}: {$s->price} ج.م")->implode("\n");
        
        $staff = $tenant->staff()->where('is_active', true)->get()
            ->map(fn($st) => "- {$st->name} (ID: {$st->id})")->implode("\n");
        
        $history = Message::where('tenant_id', $tenant->id)
            ->where(fn($q) => $q->where('sender_phone', $phone)->orWhere('receiver_phone', $phone))
            ->latest()->take(6)->get()->reverse()
            ->map(fn($m) => ($m->direction === 'inbound' ? 'العميل: ' : 'الصالون: ') . $m->message_body)
            ->implode("\n");

        $basePrompt = <<<PROMPT
أنت موظف استقبال ذكي في صالون '{$tenant->name}'. ردودك يجب أن تكون:
1. قصيرة ومباشرة (جملة أو جملتين فقط)
2. باللغة العربية الودية
3. الوقت دائماً بصيغة: "3 مساءً" أو "10 صباحاً" (لا تستخدم أبداً 15:00 أو AM/PM)

{$calendarReference}

ساعات العمل:
{$workingHours}

الخدمات والأسعار:
{$services}

الموظفين:
{$staff}

سجل المحادثة:
{$history}

رسالة العميل الجديدة: {$message}

--- قواعد صارمة لا تخترق ---
- إذا أراد العميل الحجز وتأكد من الخدمة والموعد: أرجع action=create_booking فوراً
- إذا لم يحدد الوقت: اسأل عنه فقط قبل الحجز
- لا تؤكد الحجز في رسالتك - الصالون هو من يؤكد
- في booking_details: الوقت يجب أن يكون بصيغة "YYYY-MM-DD HH:MM:SS"

أرجع JSON فقط بهذا الشكل الصارم:
{
  "action": "reply" أو "create_booking",
  "message": "ردك القصير هنا",
  "booking_details": {
    "service_name": "اسم الخدمة",
    "time": "YYYY-MM-DD HH:MM:SS",
    "staff_id": null
  }
}
PROMPT;

        $response = $this->aiRouter->route($basePrompt, $tenant, 'whatsapp_receptionist', true);

        if ($response['success']) {
            $data = $response['data'];
            if (is_string($data)) {
                $decoded = $this->extractJson($data);
                if ($decoded) return $decoded;
                return ['action' => 'reply', 'message' => $data];
            }
            return $data;
        }

        // إذا فشل كل شيء
        $rawText = $response['raw_text'] ?? null;
        if ($rawText) {
            $decoded = $this->extractJson($rawText);
            if ($decoded) return $decoded;
            return ['action' => 'reply', 'message' => $rawText];
        }

        return ['action' => 'reply', 'message' => 'أعتذر منك يا فندم، النظام مشغول قليلاً. كيف يمكنني مساعدتك؟'];
    }



    public function handleBookingAction($tenant, $senderPhone, $details, $phoneNumberId, $realPhone = null)
    {
        $time = $details['time'] ?? null;
        $staffId = $details['staff_id'] ?? null;
        if (!$time) return;
        $bookingPhone = $realPhone ?: $senderPhone;

        if ($this->isSlotAvailable($tenant, $time, $staffId)) {
            $booking = $this->createBookingFromAI($tenant, $bookingPhone, $details);
            if ($booking) {
                $serviceNameText = $details['service_name'] ?? 'الخدمة المطلوبة';
                
                // ✅ صياغة الوقت بالعربي (صباحاً/مساءً)
                $parsedTime = Carbon::parse($time);
                $hour = (int)$parsedTime->format('H');
                $minute = $parsedTime->format('i');
                $arabicHour = $hour % 12 ?: 12;
                $period = $hour < 12 ? 'صباحاً' : 'مساءً';
                $timeArabic = $parsedTime->format('Y-m-d') . " الساعة {$arabicHour}" . ($minute !== '00' ? ":{$minute}" : '') . " {$period}";

                // ✅ إشعار العميل: طلبك قيد المراجعة (ليس تأكيداً)
                $msgToClient = "شكراً لك! 🙏 تم استلام طلب حجزك في {$tenant->name}.\n📌 الخدمة: {$serviceNameText}\n🕐 الموعد: {$timeArabic}\n\nسنتواصل معك فور تأكيد الحجز من الصالون.";
                $this->sendWhatsAppMessage($tenant, $phoneNumberId, $senderPhone, $msgToClient);

                // ✅ إشعار صاحب الصالون بطلب حجز جديد
                Log::info("AI_BOOKING_REQUEST: New booking pending approval", [
                    'tenant_id'      => $tenant->id,
                    'booking_id'     => $booking->id,
                    'customer_phone' => $bookingPhone,
                    'service'        => $serviceNameText,
                    'time'           => $timeArabic
                ]);

                if ($tenant->whatsapp_number) {
                    $msgToOwner = "🔔 طلب حجز جديد من الواتساب!\n👤 العميل: {$bookingPhone}\n✂️ الخدمة: {$serviceNameText}\n🕐 الموعد: {$timeArabic}\n\n👉 افتح لوحة التحكم لتأكيد أو رفض الحجز.";
                    $this->sendWhatsAppMessage($tenant, $phoneNumberId, $tenant->whatsapp_number, $msgToOwner);
                }
            }
        } else {
            $this->sendWhatsAppMessage($tenant, $phoneNumberId, $senderPhone, "أعتذر منك يا فندم، هذا الموعد محجوز مسبقاً. هل تريد اختيار موعد آخر؟ 😊");
        }
    }


    private function isSlotAvailable($tenant, $time, $staffId = null)
    {
        $appointmentAt = Carbon::parse($time);
        $query = Booking::where('tenant_id', $tenant->id)
            ->whereIn('status', ['pending', 'confirmed'])
            ->where(function($q) use ($appointmentAt) {
                $q->whereBetween('appointment_at', [
                    $appointmentAt->copy()->subMinutes(59), 
                    $appointmentAt->copy()->addMinutes(59)
                ]);
            });
            
        if ($staffId) {
            $query->where('staff_id', $staffId);
        }
        
        return !$query->exists();
    }

    private function createBookingFromAI($tenant, $phone, $details)
    {
        // ✅ البحث أولاً بالرقم الحقيقي (غير مشفر) لتجنب تكرار العملاء
        $customer = Customer::where('tenant_id', $tenant->id)
            ->where('phone', $phone)
            ->first();

        if (!$customer) {
            $customer = Customer::create([
                'tenant_id' => $tenant->id,
                'phone' => $phone,
                'name' => $details['customer_name'] ?? 'عميل واتساب',
                'phone_hash' => hash('sha256', $phone),
            ]);
        } elseif (($customer->name === 'عميل واتساب' || $customer->name === 'عميل جديد') && !empty($details['customer_name'])) {
            $customer->update(['name' => $details['customer_name']]);
        }

        $serviceName = $details['service_name'] ?? 'خدمة عامة';
        $service = Service::where('tenant_id', $tenant->id)
            ->where('name', 'like', '%' . $serviceName . '%')
            ->first();

        // ✅ إنشاء الخدمة تلقائياً إذا لم تكن موجودة لمنع خطأ قاعدة البيانات
        if (!$service) {
            $service = Service::create([
                'tenant_id' => $tenant->id,
                'name' => $serviceName,
                'price' => 0,
                'duration' => 60
            ]);
        }

        // ✅ الحجز دائماً بحالة "pending" - يجب موافقة صاحب الصالون
        return Booking::create([
            'tenant_id'      => $tenant->id,
            'customer_id'    => $customer->id,
            'service_id'     => $service->id,
            'staff_id'       => $details['staff_id'] ?? null,
            'appointment_at' => $details['time'],
            'status'         => 'pending',
            'notes'          => 'تم الحجز عبر الذكاء الاصطناعي (واتساب)',
            'total_price'    => $service->price ?? 0,
        ]);
    }

    public function sendWhatsAppMessage($tenant, $phoneNumberId, $to, $message)
    {
        if ($phoneNumberId === 'unofficial' || config('services.whatsapp.use_bridge')) {
            return Http::withHeaders(['Authorization' => 'Bearer o2oeg_bridge_secret_2026_z8v9'])
                ->post("https://o2oeg.com/bridge/send", ['tenantId' => $tenant->id, 'to' => $to, 'text' => $message])
                ->successful();
        }
        $token = $tenant->whatsapp_access_token ?: config('services.whatsapp.access_token');
        return Http::withToken($token)->post("https://graph.facebook.com/v21.0/{$phoneNumberId}/messages", [
            'messaging_product' => 'whatsapp', 'to' => $to, 'type' => 'text', 'text' => ['body' => $message]
        ])->successful();
    }

    private function transcribeBase64Audio($base64)
    {
        $groqKey = env('GROQ_API_KEY');
        if (!$groqKey) return "(صوت)";
        try {
            $temp = tempnam(sys_get_temp_dir(), 'aud_') . '.ogg';
            file_put_contents($temp, base64_decode($base64));
            $res = Http::withToken($groqKey)->attach('file', file_get_contents($temp), 'audio.ogg')->post('https://api.groq.com/openai/v1/audio/transcriptions', ['model' => 'whisper-large-v3-turbo', 'language' => 'ar']);
            unlink($temp);
            return $res->json()['text'] ?? '(صوت غير واضح)';
        } catch (\Exception $e) { return '(فشل قراءة الصوت)'; }
    }

    private function transcribeAudioFromMeta($audioId, $token)
    {
        if (!$audioId || !$token) return "(صوت)";
        try {
            $mediaRes = Http::withToken($token)->get("https://graph.facebook.com/v21.0/{$audioId}");
            if ($mediaRes->successful()) {
                $url = $mediaRes->json()['url'];
                $fileRes = Http::withToken($token)->get($url);
                return $this->transcribeBase64Audio(base64_encode($fileRes->body()));
            }
        } catch (\Exception $e) { Log::error("Meta Audio Error: " . $e->getMessage()); }
        return "(صوت غير متوفر)";
    }

    private function extractJson($text)
    {
        $start = strpos($text, '{');
        $end = strrpos($text, '}');
        if ($start !== false && $end !== false) {
            $json = substr($text, $start, $end - $start + 1);
            return json_decode($json, true);
        }
        return null;
    }
}
