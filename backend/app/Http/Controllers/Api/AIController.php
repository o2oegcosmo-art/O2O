<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Tenant;
use App\Models\Customer;
use App\Models\Booking;
use App\Models\Service;
use App\Models\Message;
use App\Notifications\BookingStatusNotification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

use App\Services\AISecurityService;

class AIController extends Controller
{
    protected $security;

    public function __construct(AISecurityService $security)
    {
        $this->security = $security;
    }

    /**
     * التحقق من طلب Meta Webhook (GET request)
     */
    public function verifyWebhook(Request $request)
    {
        Log::info("WhatsApp Verification Attempt", $request->all());

        $verifyToken = config('services.whatsapp.webhook_verify_token');
        $mode = $request->query('hub_mode');
        $token = $request->query('hub_verify_token');
        $challenge = $request->query('hub_challenge');

        if ($mode === 'subscribe' && $token === $verifyToken) {
            Log::info("Verification Successful!");
            return response($challenge, 200);
        }

        Log::warning("Verification Failed!", [
            'expected' => $verifyToken,
            'received' => $token,
            'mode' => $mode
        ]);
        return response('Forbidden', 403);
    }

    /**
     * معالجة رسائل واتساب الواردة (POST request)
     */
    public function handleWebhook(Request $request)
    {
        // SEC-001 FIX: Webhook Signature Verification (Smart Lock)
        // Only enforced if WHATSAPP_STRICT_MODE is true or in production environment
        if (config('services.whatsapp.strict_mode') || config('app.env') === 'production') {
            $signature = $request->header('X-Hub-Signature-256');
            $appSecret = config('services.whatsapp.app_secret');

            if ($signature && $appSecret) {
                $payload = $request->getContent();
                $expected = 'sha256=' . hash_hmac('sha256', $payload, $appSecret);
                if (!hash_equals($expected, $signature)) {
                    Log::warning("Webhook: Invalid Signature", ['ip' => $request->ip()]);
                    return response()->json(['error' => 'Invalid signature'], 403);
                }
            } else if (config('app.env') === 'production') {
                Log::warning("Webhook: Missing Signature/Secret in Production", ['ip' => $request->ip()]);
                return response()->json(['error' => 'Unauthorized'], 401);
            }
        }

        // 🔒 التحقق من أمان الجسر (Development Only)
        $bridgeKey = $request->header('X-Bridge-Key');
        if (config('services.whatsapp.use_bridge') && $bridgeKey !== env('BRIDGE_API_KEY')) {
            Log::warning("Unauthorized Bridge Access Attempt", ['ip' => $request->ip()]);
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        Log::info("WhatsApp Webhook Hit", $request->all());

        // 🟢 الجديد: استلام معرف المستأجر من الجسر (Multi-Tenant Support)
        $bridgeTenantId = $request->input('tenant_id');

        // 1. استلام ومعالجة البيانات من Meta Cloud API أو الجسر
        $entry = $request->input('entry.0.changes.0.value');

        if (!$entry || !isset($entry['messages'][0])) {
            return response()->json(['success' => false, 'message' => 'No message found in payload']);
        }

        $messageObj = $entry['messages'][0];
        $senderPhone = $messageObj['from']; // رقم العميل (WhatsApp ID)
        $incomingMessage = $messageObj['text']['body'] ?? ''; // محتوى الرسالة النصية
        $toPhone = $entry['metadata']['display_phone_number'] ?? ''; // رقم الصالون المستهدف
        $phoneNumberId = $entry['metadata']['phone_number_id'] ?? null; // ID رقم الهاتف لإرسال الرد
        
        Log::info("WhatsApp Message Received", ['from' => $senderPhone, 'message' => $incomingMessage]);

        // 2. تحديد الصالون (Tenant) بناءً على معرف الجسر أو رقم الهاتف
        $tenant = null;
        
        if ($bridgeTenantId) {
            $tenant = Tenant::find($bridgeTenantId);
        }

        if (!$tenant && $phoneNumberId) {
            $tenant = Tenant::where('whatsapp_phone_number_id', $phoneNumberId)->first();
        }
        
        if (!$tenant) {
            $tenant = Tenant::where('whatsapp_number', $toPhone)->first();
        }

        if (!$tenant && config('app.env') === 'local' && !config('services.whatsapp.strict_mode')) {
            $tenant = Tenant::first();
        }

        if (!$tenant) {
            Log::warning("Webhook received for unknown Tenant/Phone ID", ['phone_id' => $phoneNumberId, 'to' => $toPhone]);
            return response()->json(['success' => false, 'message' => 'Tenant not found']);
        }

        // تسجيل الرسالة الواردة في السجل
        Message::create([
            'tenant_id' => $tenant->id,
            'sender_phone' => $senderPhone,
            'receiver_phone' => $toPhone,
            'message_body' => $incomingMessage,
            'direction' => 'inbound',
        ]);

        // 3. التحقق من صلاحية وصول الصالون لميزة الـ AI (Feature Gating)
        $hasAiFeature = $tenant->services()
            ->where('slug', 'ai-receptionist')
            ->wherePivot('status', 'active')
            ->exists();
        
        Log::info("AI Feature Check", ['tenant_id' => $tenant->id, 'has_feature' => $hasAiFeature]);

        if (!$hasAiFeature && config('app.env') !== 'local') {
            return response()->json(['success' => false, 'message' => 'AI feature not active for this tenant']);
        }

        // 🟢 الجديد: التحقق من سقف الاستخدام (Usage Limits)
        $usageService = app(\App\Services\AIUsageService::class);
        $canUse = $usageService->canUseAI($tenant);
        Log::info("AI Usage Limit Check", ['can_use' => $canUse]);

        if (!$canUse && config('app.env') !== 'local') {
            Log::info("AI Limit reached for tenant", ['tenant_id' => $tenant->id]);
            return response()->json(['success' => false, 'message' => 'Monthly or Daily AI limit reached']);
        }

        // 4. إرسال المهمة للطابور (Queue) للمعالجة في الخلفية
        \App\Jobs\ProcessAIWhatsAppMessage::dispatch($tenant, $senderPhone, $incomingMessage, $phoneNumberId);

        return response()->json(['success' => true, 'message' => 'Message received and queued for processing']);
    }

    /**
     * معالجة إجراء الحجز (يُستدعى من الـ Job)
     */
    public function handleBookingAction($tenant, $senderPhone, $details, $phoneNumberId)
    {
        if ($this->isSlotAvailable($tenant, $details['time'], $details['staff_id'] ?? null)) {
            $booking = $this->createBookingFromAI($tenant, $senderPhone, $details);
            if ($booking) {
                $booking->customer->notify(new BookingStatusNotification($booking));
            }
        } else {
            $alternatives = $this->findAlternativeSlots($tenant, $details['time'], $details['staff_id'] ?? null);
            $suggestionMessage = $this->generateAlternativeSuggestion($tenant, $details, $alternatives);
            $this->sendWhatsAppMessage($tenant, $phoneNumberId, $senderPhone, $suggestionMessage);
        }
    }

    /**
     * دالة للتحقق من تضارب المواعيد
     */
    private function isSlotAvailable($tenant, $appointmentTime, $staffId = null)
    {
        $query = Booking::where('tenant_id', $tenant->id)
            ->where('appointment_at', $appointmentTime)
            ->whereIn('status', ['pending', 'confirmed']); // الحجوزات النشطة فقط

        // إذا تم تحديد موظف معين، نتحقق من جدوله هو فقط
        if ($staffId) {
            $query->where('staff_id', $staffId);
        }

        return !$query->exists();
    }

    /**
     * البحث عن أقرب مواعيد متاحة للعميل (مع مراعاة ساعات العمل)
     */
    private function findAlternativeSlots($tenant, $requestedTime, $staffId = null, $limit = 3)
    {
        $alternatives = [];
        $checkTime = \Illuminate\Support\Carbon::parse($requestedTime)->addHour();
        
        // جلب ساعات العمل للتحقق منها
        $workingHours = DB::table('working_hours')
            ->where('tenant_id', $tenant->id)
            ->whereNull('staff_id')
            ->get()
            ->keyBy('day_of_week');

        // البحث في الـ 48 ساعة القادمة
        while (count($alternatives) < $limit) {
            $dayOfWeek = $checkTime->dayOfWeek; // 0 (Sunday) to 6 (Saturday)
            $wh = $workingHours->get($dayOfWeek);

            $isOpen = false;
            if ($wh && !$wh->is_closed) {
                $currentTime = $checkTime->format('H:i:s');
                if ($currentTime >= $wh->start_time && $currentTime <= $wh->end_time) {
                    $isOpen = true;
                }
            }

            if ($isOpen && $this->isSlotAvailable($tenant, $checkTime->format('Y-m-d H:i:s'), $staffId)) {
                $alternatives[] = $checkTime->format('Y-m-d h:i A');
            }
            
            $checkTime->addHour();
            
            // التوقف إذا تجاوزنا اليومين
            if ($checkTime->diffInDays(\Illuminate\Support\Carbon::parse($requestedTime)) > 2) break;
        }
        
        return $alternatives;
    }

    /**
     * استخدام الـ AI لصياغة اعتذار واقتراح مواعيد بديلة بأسلوب محترف
     */
    private function generateAlternativeSuggestion($tenant, $details, $alternatives)
    {
        if (empty($alternatives)) {
            return "أعتذر منك جداً يا فندم، الموعد المطلوب غير متاح حالياً وجميع المواعيد القريبة محجوزة. هل يمكنني مساعدتك في اختيار يوم آخر؟";
        }

        $altsString = implode(', ', $alternatives);
        $prompt = "أنت موظف استقبال محترف وودود في صالون '{$tenant->name}'. 
العميل طلب حجز ميعاد لخدمة '{$details['service_name']}' في وقت '{$details['time']}'.
للأسف هذا الموعد غير متاح حالياً.
المواعيد البديلة المتاحة التي وجدتها في الجدول هي: [{$altsString}].

المطلوب:
1. اعتذر للعميل بلباقة شديدة مستخدماً لفظ 'يا فندم'.
2. اقترح عليه المواعيد البديلة المذكورة أعلاه.
3. كن ودوداً جداً بلهجة مصرية مهذبة (بدون كلمات شعبية).
4. الرد نصي فقط (بدون JSON).";

        try {
            $apiKey = $tenant->google_ai_api_key ?: config('services.google.ai_key', env('GEMINI_API_KEY'));
            $response = \Illuminate\Support\Facades\Http::withoutVerifying()
                ->post('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' . $apiKey, [
                    'contents' => [['parts' => [['text' => $prompt]]]]
                ]);

            if ($response->successful()) {
                return $response->json()['candidates'][0]['content']['parts'][0]['text'] ?? "أعتذر منك يا فندم، الموعد غير متاح. المواعيد البديلة المتاحة هي: {$altsString}. أي ميعاد يناسب حضرتك؟";
            }
        } catch (\Exception $e) {
            Log::error("Alternative Suggestion AI Error: " . $e->getMessage());
        }

        return "أعتذر منك يا فندم، الموعد الذي اخترته غير متاح حالياً. المواعيد المتاحة هي: {$altsString}. أي ميعاد يناسب حضرتك؟";
    }

    /**
     * إرسال رسالة نصية عبر Meta Cloud API
     */
    public function sendWhatsAppMessage($tenant, $phoneNumberId, $to, $message)
    {
        Log::info("Attempting to send WhatsApp message", ['to' => $to, 'phone_id' => $phoneNumberId, 'use_bridge' => config('services.whatsapp.use_bridge')]);

        // 🟢 دعم الجسر غير الرسمي (Local Bridge Support)
        if ($phoneNumberId === 'unofficial' || config('services.whatsapp.use_bridge')) {
            Log::info("Using WhatsApp Bridge to send message", ['tenant_id' => $tenant->id ?? 'unknown']);
            $response = \Illuminate\Support\Facades\Http::withoutVerifying()
                ->post("http://127.0.0.1:9000/send", [
                    'tenantId' => $tenant->id, // إرسال معرف المشترك للجسر
                    'to' => $to,
                    'text' => $message,
                ]);
            
            if ($response->successful()) {
                Log::info("Message sent via Bridge successfully");
                Message::create([
                    'tenant_id' => $tenant->id ?? null,
                    'sender_phone' => 'system_bridge',
                    'receiver_phone' => $to,
                    'message_body' => $message,
                    'direction' => 'outbound',
                ]);
            } else {
                Log::error("WhatsApp Bridge Send Error", [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
            }
            return $response->successful();
        }

        $accessToken = $tenant->whatsapp_access_token ?: config('services.whatsapp.access_token');
        
        $response = \Illuminate\Support\Facades\Http::withToken($accessToken)
            ->withoutVerifying()
            ->post("https://graph.facebook.com/v21.0/{$phoneNumberId}/messages", [
                'messaging_product' => 'whatsapp',
                'recipient_type' => 'individual',
                'to' => $to,
                'type' => 'text',
                'text' => ['body' => $message],
            ]);

        if (!$response->successful()) {
            Log::error("WhatsApp Send Error", $response->json());
        } else {
            // تسجيل الرسالة الصادرة في السجل
            Message::create([
                'tenant_id' => $tenant->id ?? null,
                'sender_phone' => 'system',
                'receiver_phone' => $to,
                'message_body' => $message,
                'direction' => 'outbound',
                'message_id' => $response->json()['messages'][0]['id'] ?? null,
            ]);
        }

        return $response->successful();
    }

    /**
     * إرسال رسالة باستخدام قالب رسمي (Template)
     */
    public static function sendWhatsAppTemplate($tenant, $to, $templateName, $language = 'ar', $parameters = [])
    {
        $accessToken = ($tenant && $tenant->whatsapp_access_token) 
            ? $tenant->whatsapp_access_token 
            : config('services.whatsapp.access_token');
            
        $phoneNumberId = ($tenant && $tenant->whatsapp_phone_number_id) 
            ? $tenant->whatsapp_phone_number_id 
            : config('services.whatsapp.phone_number_id'); 
        
        $components = [];
        if (!empty($parameters)) {
            $formattedParams = array_map(fn($val) => ['type' => 'text', 'text' => (string)$val], $parameters);
            $components[] = [
                'type' => 'body',
                'parameters' => $formattedParams
            ];
        }

        // 🟢 دعم الجسر غير الرسمي للقوالب (تحويل القالب لنص عادي)
        if ($phoneNumberId === 'unofficial' || config('services.whatsapp.use_bridge')) {
            $message = "Welcome! (Template: {$templateName})";
            if (!empty($parameters)) {
                $message .= "\nDetails: " . implode(", ", $parameters);
            }
            
            return \Illuminate\Support\Facades\Http::withoutVerifying()
                ->post("http://127.0.0.1:9000/send", [
                    'tenantId' => $tenant->id,
                    'to' => $to,
                    'text' => $message,
                ])->successful();
        }

        $response = \Illuminate\Support\Facades\Http::withToken($accessToken)
            ->withoutVerifying()
            ->post("https://graph.facebook.com/v21.0/{$phoneNumberId}/messages", [
                'messaging_product' => 'whatsapp',
                'to' => $to,
                'type' => 'template',
                'template' => [
                    'name' => $templateName,
                    'language' => ['code' => $language],
                    'components' => $components
                ],
            ]);

        if (!$response->successful()) {
            Log::error("WhatsApp Template Send Error", $response->json());
        }

        return $response->successful();
    }

    /**
     * معالجة الرسالة باستخدام Google Gemini API (LLM)
     */
    public function processMessageWithAI($tenant, $phone, $message)
    {
        // جلب كافة الخدمات (سواء المرتبطة بالباقة أو الخاصة بالصالون مباشرة)
        $platformServices = $tenant->services()->get();
        $salonServices = Service::where('tenant_id', $tenant->id)->get();
        $allServices = $platformServices->merge($salonServices);
        
        $servicesList = $allServices->map(fn($s) => "- {$s->name} (" . ($s->price > 0 ? "{$s->price} ج.م" : "حسب الخدمة") . ")")->implode("\n");
        $staff = $tenant->staff()->where('is_active', true)->get()->map(fn($st) => "- {$st->name}")->implode("\n");
        $daysMap = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        $workingHours = DB::table('working_hours')
            ->where('tenant_id', $tenant->id)
            ->whereNull('staff_id')
            ->get()
            ->map(fn($h) => "- {$daysMap[$h->day_of_week]}: من " . substr($h->start_time, 0, 5) . " إلى " . substr($h->end_time, 0, 5) . ($h->is_closed ? " (مغلق)" : ""))
            ->implode("\n");

        $now = now()->format('Y-m-d H:i:s (l)');
        // 1. التحقق من زمن آخر رسالة لتحديد هل نحتاج للترحيب أم لا
        $lastOutbound = Message::where('receiver_phone', $phone)
            ->where('direction', 'outbound')
            ->latest()
            ->first();

        $shouldGreet = !$lastOutbound || $lastOutbound->created_at->diffInMinutes(now()) >= 30;
        $greetingInstruction = $shouldGreet ? "قاعدة هامة: يجب أن تبدأ رسالتك بـ 'أهلاً بيك يا فندم'." : "قاعدة هامة: لا تكرر الترحيب بـ 'أهلاً بيك يا فندم' لأنك تتحدث مع العميل بالفعل، ادخل في صلب الموضوع مباشرة بأسلوب لبق.";
        
        $rawPrompt = "أنت موظف استقبال محترف، خبير في فن البيع والتسويق التجاري، وتعمل في صالون '{$tenant->name}'. 
مهمتك هي الرد على العملاء بذكاء لإقناعهم بالحجز وزيادة المبيعات.

الوقت الحالي هو: {$now}.
{$greetingInstruction}

--- تعليمات فن البيع واللباقة التجارية ---
- 'البيع بالمنفعة': اشرح للعميل كيف ستجعله الخدمة يشعر بالجمال والراحة.
- 'البيع التكميلي' (Cross-selling): إذا طلب العميل خدمة، اقترح عليه خدمة تكميلية (مثلاً: مع الصبغة اقترح حمام كريم معالج).
- 'بناء الثقة': أكد على جودة الخامات وخبرة الموظفين.
- 'اللباقة': استخدم لغة راقية ومهذبة جداً، وتجنب الردود الآلية الجافة. العميل يجب أن يشعر أنه يتحدث مع إنسان حقيقي.

--- الخدمات المتاحة وأسعارها ---
{$servicesList}

--- الموظفين المتاحين ---
{$staff}

--- مواعيد العمل ---
{$workingHours}

--- القواعد الصارمة للرد ---
1. التزم تماماً بمواعيد العمل. لا تقترح أي موعد خارج ساعات العمل أو في الأيام المغلقة.
2. استخدم دائماً لفظ 'يا فندم' عند مخاطبة العميل.
3. ممنوع تماماً استخدام كلمات غير رسمية مثل 'يا ذوق' أو 'يا برنس' أو 'يا غالي'. استخدم دائماً اللهجة المصرية العامية المحترفة واللبقة (مثل: 'تحت أمرك يا فندم'، 'تنورنا في أي وقت'، 'عينينا ليك').
4. إذا كان العميل يطلب خدمة غير موجودة، اعتذر منه بلباقة واقترح البدائل.
5. إذا طلب حجزاً، استخرج الخدمة والوقت بدقة.

الشكل المطلوب للرد (JSON خالص):
{
    \"action\": \"reply\" أو \"create_booking\",
    \"message\": \"رسالتك للعميل هنا (ابدأ دائماً بـ 'أهلاً يا فندم')\",
    \"booking_details\": {
        \"service_name\": \"اسم الخدمة من القائمة\",
        \"time\": \"YYYY-MM-DD HH:MM:SS\"
    }
}

--- رسالة العميل (SEC-002 Guard) ---
<customer_message>
" . $this->security->sanitizeInboundMessage($message) . "
</customer_message>";

        $prompt = $this->security->applyShield($rawPrompt);


        try {
            // 1. PRIMARY: Hostinger Local Ollama (Llama 3)
            Log::info("Trying Hostinger Local Ollama (Llama 3)...");
            try {
                $ollamaResponse = \Illuminate\Support\Facades\Http::withoutVerifying()
                    ->timeout(180) // CPU-only server needs more time for large prompts
                    ->post("http://72.62.182.106:11434/api/generate", [
                        'model' => 'qwen2.5:7b',
                        'prompt' => $prompt . "\n\nImportant: Respond ONLY with a valid JSON object matching the requested format.",
                        'stream' => false,
                        'format' => 'json'
                    ]);

                if ($ollamaResponse->successful()) {
                    $text = $ollamaResponse->json()['response'] ?? '';
                    Log::info("Ollama Response Text: " . $text);
                    $decoded = $this->extractJson($text);
                    if ($decoded) {
                        $this->security->validateAndAudit($tenant, 'whatsapp_receptionist', 'ollama-llama3', $prompt, $decoded);
                        return $decoded;
                    }
                } else {
                    Log::error("Ollama API Request Failed", [
                        'status' => $ollamaResponse->status(),
                        'body' => $ollamaResponse->body()
                    ]);
                }
            } catch (\Exception $e) {
                Log::error("Ollama primary failed: " . $e->getMessage());
            }

            // 2. FALLBACK 1: Gemini Models
            $apiKey = $tenant->google_ai_api_key ?: config('services.google.ai_key', env('GEMINI_API_KEY'));
            $models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];
            
            if ($apiKey && $apiKey !== 'YOUR_API_KEY_HERE') {
                foreach ($models as $model) {
                    try {
                        $response = \Illuminate\Support\Facades\Http::withoutVerifying()
                            ->timeout(30)
                            ->post('https://generativelanguage.googleapis.com/v1beta/models/' . $model . ':generateContent?key=' . $apiKey, [
                            'contents' => [['parts' => [['text' => $prompt]]]]
                        ]);

                        if ($response->successful()) {
                            $text = $response->json()['candidates'][0]['content']['parts'][0]['text'] ?? '';
                            $decoded = $this->extractJson($text);
                            if ($decoded) {
                                $this->security->validateAndAudit($tenant, 'whatsapp_receptionist', $model, $prompt, $decoded);
                                return $decoded;
                            }
                        }
                    } catch (\Exception $e) {
                        Log::error("Gemini model {$model} failed: " . $e->getMessage());
                    }
                }
            }

            // 3. FALLBACK 2: Groq
            $groqKey = env('GROQ_API_KEY');
            if ($groqKey) {
                Log::info("Gemini failed, falling back to Groq");
                $groqResponse = \Illuminate\Support\Facades\Http::withoutVerifying()
                    ->withHeaders([
                        'Authorization' => "Bearer " . config('services.groq.api_key', $groqKey),
                        'Content-Type' => 'application/json',
                    ])
                    ->timeout(30)
                    ->post("https://api.groq.com/openai/v1/chat/completions", [
                        'model' => config('services.groq.model', 'llama-3.3-70b-versatile'),
                        'messages' => [
                            ['role' => 'system', 'content' => "أنت موظف استقبال محترف في صالون تجميل. يجب أن يكون الرد بصيغة JSON فقط متضمناً الحقول: action (إما reply أو create_booking) و message (نص الرد للعميل)."],
                            ['role' => 'user', 'content' => $prompt]
                        ],
                        'response_format' => ['type' => 'json_object']
                    ]);

                if ($groqResponse->successful()) {
                    $text = $groqResponse->json()['choices'][0]['message']['content'] ?? '';
                    Log::info("Groq Response Text: " . $text);
                    $decoded = json_decode($text, true);
                    if ($decoded) {
                        $this->security->validateAndAudit($tenant, 'whatsapp_receptionist', config('services.groq.model'), $prompt, $decoded);
                        return $decoded;
                    }
                } else {
                    Log::error("Groq API Request Failed", [
                        'status' => $groqResponse->status(),
                        'body' => $groqResponse->body()
                    ]);
                }
            }
        } catch (\Exception $e) {
            Log::error('AI Processing Full Failure: ' . $e->getMessage());
        }

        // في حالة فشل الـ AI أو الـ API، نعود للرد الافتراضي
        return [
            'action' => 'reply',
            'message' => 'عذراً، أواجه مشكلة تقنية حالياً. هل يمكنك إعادة المحاولة بعد قليل؟',
        ];
    }

    /**
     * تنفيذ إجراء الحجز الذي حدده الـ AI
     */
    private function createBookingFromAI($tenant, $phone, $details)
    {
        // 1. إيجاد العميل بـ Hash الرقم (لأنه مشفر)
        $cleanPhone = str_replace('whatsapp:', '', $phone);
        $phoneHash = hash('sha256', $cleanPhone);
        $customer = $tenant->customers()->where('phone_hash', $phoneHash)->first();

        if (!$customer) {
            $customer = $tenant->customers()->create([
                'phone' => $cleanPhone,
                'name' => 'عميل واتساب'
            ]);
        }

        // 2. إيجاد الخدمة المطلوبة (من المنصة أو الصالون)
        $service = Service::where(function($q) use ($tenant) {
                $q->where('tenant_id', $tenant->id)
                  ->orWhereHas('tenants', fn($sq) => $sq->where('tenants.id', $tenant->id));
            })
            ->where('name', 'like', '%' . $details['service_name'] . '%')
            ->first();
        
        if (!$service) {
            Log::warning("AI Booking: Service not found", ['service' => $details['service_name']]);
            return null; // SEC-010 FIX: Never fallback to random service
        }

        // 3. SEC-002 FIX: Validate appointment time
        $appointmentAt = isset($details['time']) ? \Illuminate\Support\Carbon::parse($details['time']) : null;
        
        // Strict Mode Check: Future dates only
        if (config('services.whatsapp.strict_mode') || config('app.env') === 'production') {
            if (!$appointmentAt || $appointmentAt->isPast() || $appointmentAt->diffInMonths(now()) > 3) {
                Log::warning("AI Booking: Invalid Time Rejected", ['time' => $details['time']]);
                return null;
            }
        }

        // 4. إنشاء الحجز
        if ($service) {
            return Booking::create([
                'tenant_id' => $tenant->id,
                'customer_id' => $customer->id,
                'service_id' => $service->id,
                'appointment_at' => $appointmentAt ?? now()->addHour(),
                'price' => $service->price,
                'status' => 'pending',
                'payment_method' => 'cash', 
                'internal_notes' => 'تم الحجز آلياً عبر الذكاء الاصطناعي',
            ]);
        }
        return null;
    }

    /**
     * استخراج الـ JSON من رد الـ AI
     */
    private function extractJson($text)
    {
        Log::info("AI Text to Extract JSON from: " . $text);
        $startPos = strpos($text, '{');
        $endPos = strrpos($text, '}');

        if ($startPos !== false && $endPos !== false) {
            $jsonContent = substr($text, $startPos, $endPos - $startPos + 1);
            $decoded = json_decode($jsonContent, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                Log::info("AI JSON Extracted Successfully");
                return $decoded;
            }
        }

        Log::warning("AI JSON Extraction Failed", ['text' => $text]);
        $cleaned = str_replace(['```json', '```'], '', $text);
        $decoded = json_decode(trim($cleaned), true);
        
        return (json_last_error() === JSON_ERROR_NONE) ? $decoded : null;
    }
}

