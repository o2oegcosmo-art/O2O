<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CrmClient;
use App\Models\CrmOpportunity;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CrmAIController extends Controller
{
    /**
     * محرك الاستشارات الذكي للشركات
     */
    public function consult(Request $request)
    {
        $tenant = $request->user()->tenant;
        $tenantId = $tenant->id;

        // 1. تجميع البيانات السياقية (Context)
        $clients = CrmClient::where('tenant_id', $tenantId)->get(['salon_name', 'city', 'tier', 'monthly_spend', 'last_visit_at']);
        $pipeline = CrmOpportunity::where('tenant_id', $tenantId)->get(['title', 'estimated_value', 'stage']);
        $events = Event::where('tenant_id', $tenantId)->withCount(['analytics as clicks' => function($q) { $q->where('type', 'click'); }])->get(['title', 'type', 'is_promoted']);

        // 2. صياغة البرومبت الاحترافي (System Prompt)
        $systemPrompt = "أنت خبير استشاري متخصص في قطاع التجميل لمنصة O2OEG.
        هدفك هو تحليل بيانات CRM المقدمة وتقديم نصائح استراتيجية وقابلة للتنفيذ لمالك الشركة.
        البيانات تنتمي لشركة: {$tenant->name}.

        قواعد صارمة لا يجوز الخروج عنها:
        - يجب أن يكون الرد باللغة العربية الفصحى المهنية حصراً.
        - يُمنع منعاً باتاً استخدام أي لغة أعجمية (صينية، روسية، يابانية، كورية، إلخ).
        - يُمنع استخدام أي كلمات مشوهة أو رموز غير عربية.
        - أي خروج عن اللغة العربية يُعدّ فشلاً تاماً في المهمة.

        ركز على:
        - تحديد الصالونات المعرضة للخطر (إنفاق منخفض أو فترة طويلة منذ آخر زيارة).
        - اقتراح إجراءات مبيعات محددة لخط المبيعات الحالي.
        - التوصية باستراتيجيات تسويقية بناءً على الأداء التاريخي.
        - استخدم نبرة احترافية، تعتمد على البيانات، ومشجعة.";

        $userContext = "إليك بيانات شركتي الحالية:
        العملاء (الصالونات): " . json_encode($clients, JSON_UNESCAPED_UNICODE) . "
        خط المبيعات: " . json_encode($pipeline, JSON_UNESCAPED_UNICODE) . "
        الفعاليات السابقة: " . json_encode($events, JSON_UNESCAPED_UNICODE) . "

        بناءً على هذه البيانات، أعطني:
        1. تحليل سريع للوضع الحالي.
        2. ترشيح لـ 3 صالونات يجب التواصل معهم فوراً ولماذا.
        3. نصيحة تسويقية لزيادة المبيعات في الشهر القادم.";

        // 3. استدعاء Gemini AI
        try {
            // الحصول على مفتاح API - تم إصلاح المسار الصحيح
            $apiKey = $tenant->google_ai_api_key
                ?: config('services.google_ai.api_key')
                ?: env('GEMINI_API_KEY');

            $isInvalidKey = (!$apiKey || $apiKey === 'YOUR_API_KEY_HERE');
            $isOpenRouter = $apiKey ? str_starts_with($apiKey, 'sk-or-v1-') : false;
            $isGroq = $apiKey ? str_starts_with($apiKey, 'gsk_') : false;

            if (!$isInvalidKey) {
                if ($isGroq) {
                    // Groq Logic (Fastest) - Trying multiple models in case of deprecation
                    $groqModels = ['llama-3.3-70b-versatile', 'llama-3.1-70b-8192', 'llama3-70b-8192'];
                    foreach ($groqModels as $gModel) {
                        $response = Http::withoutVerifying()
                            ->withHeaders([
                                'Authorization' => "Bearer {$apiKey}",
                                'Content-Type' => 'application/json',
                            ])
                            ->timeout(30)
                            ->post("https://api.groq.com/openai/v1/chat/completions", [
                                'model' => $gModel,
                                'messages' => [
                                    ['role' => 'system', 'content' => $systemPrompt],
                                    ['role' => 'user', 'content' => $userContext]
                                ]
                            ]);

                        if ($response->successful()) {
                            $aiResponse = $response->json()['choices'][0]['message']['content'] ?? null;
                            if ($aiResponse) {
                                return response()->json(['success' => true, 'analysis' => $aiResponse]);
                            }
                        }

                        $errorBody = $response->json();
                        if (isset($errorBody['error']['code']) && $errorBody['error']['code'] === 'model_decommissioned') {
                            continue;
                        }
                        break;
                    }
                } elseif ($isOpenRouter) {
                    // OpenRouter Logic
                    $response = Http::withoutVerifying()
                        ->withHeaders([
                            'Authorization' => "Bearer {$apiKey}",
                            'HTTP-Referer' => 'https://o2oeg.com',
                            'X-Title' => 'O2OEG AI Platform',
                            'Content-Type' => 'application/json',
                        ])
                        ->timeout(40)
                        ->post("https://openrouter.ai/api/v1/chat/completions", [
                            'model' => 'google/gemini-flash-1.5:free',
                            'messages' => [
                                ['role' => 'system', 'content' => $systemPrompt],
                                ['role' => 'user', 'content' => $userContext]
                            ]
                        ]);

                    if ($response->successful()) {
                        $aiResponse = $response->json()['choices'][0]['message']['content'] ?? null;
                        if ($aiResponse) {
                            return response()->json(['success' => true, 'analysis' => $aiResponse]);
                        }
                    }
                } else {
                    // Google Gemini Logic - النماذج المحدثة
                    $models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-flash-latest'];
                    foreach ($models as $model) {
                        try {
                            $response = Http::withoutVerifying()
                                ->timeout(30)
                                ->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}", [
                                    'contents' => [['parts' => [['text' => $systemPrompt . "\n\n" . $userContext]]]]
                                ]);

                            if ($response->successful()) {
                                $aiResponse = $response->json()['candidates'][0]['content']['parts'][0]['text'] ?? null;
                                if ($aiResponse) {
                                    return response()->json(['success' => true, 'analysis' => $aiResponse]);
                                }
                            }
                            Log::warning("Gemini Model {$model} failed: " . $response->body());
                        } catch (\Exception $e) {
                            Log::error("Gemini Model {$model} Exception: " . $e->getMessage());
                            continue;
                        }
                    }
                }
            }

            // FALLBACK TO HOSTINGER OLLAMA IF GEMINI/OPENROUTER FAILS
            Log::info("CRM AI: Trying Hostinger Local Ollama (Llama 3)...");
            try {
                $ollamaResponse = Http::withoutVerifying()
                    ->timeout(60)
                    ->post("http://72.62.182.106:11434/api/generate", [
                        'model' => 'llama3',
                        'prompt' => $systemPrompt . "\n\n" . $userContext,
                        'stream' => false
                    ]);

                if ($ollamaResponse->successful()) {
                    $aiResponse = $ollamaResponse->json()['response'] ?? null;
                    if ($aiResponse) {
                        return response()->json(['success' => true, 'analysis' => $aiResponse]);
                    }
                }
            } catch (\Exception $e) {
                Log::error("CRM AI Ollama Fallback failed: " . $e->getMessage());
            }

            // Check if it was an invalid key error
            if (isset($response)) {
                $errorBody = $response->json();
                if (isset($errorBody['error']['message']) &&
                    (str_contains($errorBody['error']['message'], 'API key not valid') ||
                     str_contains($errorBody['error']['message'], 'Invalid API key'))) {
                    $isInvalidKey = true;
                }
            }

            if ($isInvalidKey) {
                // Simulated response - fallback mode
                $simulatedResponse = "⚠️ **تنبيه: محرك الذكاء يعمل في وضع المحاكاة**\n\n" .
                    "السبب: لم يتم العثور على مفتاح API صالح. يرجى التأكد من إعداد `GEMINI_API_KEY` في ملف `.env`.\n\n" .
                    "بناءً على البيانات المتاحة لشركتك:\n" .
                    "1. **تحليل المبيعات:** نلاحظ نمواً بنسبة 15% في مبيعات صالونات القاهرة مقارنة بالشهر الماضي.\n" .
                    "2. **أداء المندوبين:** يوجد صالونات لم تُزَر منذ أكثر من أسبوعين وتحتاج متابعة فورية.\n" .
                    "3. **فرصة نمو:** صالونات الفئة ب تظهر اهتماماً متزايداً بمنتجات العناية التخصصية.\n\n" .
                    "*هذا التحليل تجريبي، لتفعيل التحليل الحقيقي يرجى التأكد من مفتاح API.*";

                return response()->json([
                    'success' => true,
                    'analysis' => $simulatedResponse,
                    'is_simulated' => true
                ]);
            }

            Log::error("CRM AI Engine Error: " . (isset($response) ? $response->body() : 'No response'));
            return response()->json(['error' => 'فشل في التواصل مع محرك الذكاء الاصطناعي.'], 500);

        } catch (\Exception $e) {
            Log::error("CRM AI Exception: " . $e->getMessage());
            return response()->json(['error' => 'خدمة الذكاء الاصطناعي غير متاحة حالياً.'], 500);
        }
    }

    /**
     * مساعد المبيعات الذكي - اقتراح مهام يومية للمناديب
     */
    public function suggestActions(Request $request)
    {
        $tenantId = $request->user()->tenant_id;

        // 1. جلب البيانات الضرورية للتحليل
        $clients = CrmClient::where('tenant_id', $tenantId)
            ->with(['orders' => function($q) { $q->orderBy('created_at', 'desc')->take(1); }])
            ->get();

        $suggestions = [];

        foreach ($clients as $client) {
            $lastOrder = $client->orders->first();
            $daysSinceLastOrder = $lastOrder ? now()->diffInDays($lastOrder->created_at) : 999;
            $daysSinceLastVisit = $client->last_visit_at ? now()->diffInDays($client->last_visit_at) : 999;

            // منطق "نقص المخزون" المحتمل: إذا مر أكثر من 25 يوم على آخر طلب لصالون VIP
            if ($daysSinceLastOrder > 25 && $client->tier === 'vip') {
                $suggestions[] = [
                    'type' => 'stock_check',
                    'priority' => 'high',
                    'title' => "زيارة صالون {$client->salon_name} (فحص مخزون)",
                    'reason' => "الصالون من فئة VIP ولم يطلب أي منتجات منذ {$daysSinceLastOrder} يوماً. من المحتمل وجود نقص في الصبغات أو الشامبو.",
                    'client_id' => $client->id,
                    'city' => $client->city
                ];
            }

            // منطق "تنشيط العملاء": صالون لم يزره مندوب منذ أسبوعين
            if ($daysSinceLastVisit > 14 && $client->tier !== 'lead') {
                $suggestions[] = [
                    'type' => 'retention',
                    'priority' => 'medium',
                    'title' => "تنشيط عميل: {$client->salon_name}",
                    'reason' => "مرت أكثر من أسبوعين على آخر زيارة ميدانية. يفضل المرور لتوطيد العلاقة وعرض الكتالوج الجديد.",
                    'client_id' => $client->id,
                    'city' => $client->city
                ];
            }
        }

        return response()->json([
            'success' => true,
            'suggestions' => collect($suggestions)->sortByDesc('priority')->values()
        ]);
    }
}
