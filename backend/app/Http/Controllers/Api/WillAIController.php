<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\KnowledgeBase;
use App\Models\PlatformInsight;
use App\Services\WillAIService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WillAIController extends Controller
{
    protected $willAIService;

    public function __construct(WillAIService $willAIService)
    {
        $this->willAIService = $willAIService;
    }

    /**
     * الحصول على نصيحة استراتيجية من Will AI
     */
    public function getAdvice(Request $request)
    {
        $tenant = $request->user()->tenant;
        
        if (!$tenant) {
            return response()->json(['message' => 'Tenant context missing'], 403);
        }

        // جلب المعرفة ذات الصلة (RAG) لتعزيز الرد
        $knowledge = KnowledgeBase::where('is_active', true)
            ->where(function($q) use ($tenant) {
                $q->whereNull('tenant_id')->orWhere('tenant_id', $tenant->id);
            })->get();

        $knowledgeContext = "";
        if ($knowledge->count() > 0) {
            $knowledgeContext = "\n--- مراجع ودلائل إرشادية إضافية (Knowledge Base) ---\n";
            foreach ($knowledge as $kb) {
                $knowledgeContext .= "[{$kb->title}]: {$kb->content}\n";
            }
            $knowledgeContext .= "--- نهاية المراجع ---\n";
        }

        // جلب الرؤى العامة للمنصة (Collective Intelligence)
        $globalInsights = PlatformInsight::orderBy('significance_score', 'desc')->limit(5)->get();
        $globalContext = "";
        if ($globalInsights->count() > 0) {
            $globalContext = "\n--- رؤى من واقع السوق والمنصة (Collective Intelligence) ---\n";
            foreach ($globalInsights as $gi) {
                $globalContext .= "- {$gi->insight_text}\n";
            }
            $globalContext .= "--- نهاية رؤى السوق ---\n";
        }

        // بناء الـ Prompt مع دمج المعرفة والرؤى العامة
        $prompt = $this->willAIService->buildPrompt($tenant) . "\n" . $knowledgeContext . "\n" . $globalContext;

        // استخدام مفتاح الصالون الخاص أو مفتاح الإدارة
        $apiKey = $tenant->google_ai_api_key ?: config('services.google_ai.api_key');
        
        if (!$apiKey || $apiKey === 'YOUR_API_KEY_HERE') {
            return response()->json(['message' => 'برجاء إضافة مفتاح Gemini أو OpenRouter صالح في ملف .env'], 400);
        }

        $isInvalidKey = false;
        $isOpenRouter = str_starts_with($apiKey, 'sk-or-v1-');
        $isGroq = str_starts_with($apiKey, 'gsk_');

        if ($isGroq) {
            // Groq Logic (Ultra Fast)
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
                            ['role' => 'user', 'content' => $prompt]
                        ]
                    ]);

                if ($response->successful()) {
                    $text = $response->json()['choices'][0]['message']['content'] ?? '';
                    $decodedAdvice = $this->extractJson($text);
                    if ($decodedAdvice) {
                        return response()->json(['success' => true, 'advice' => $decodedAdvice]);
                    }
                }
                
                $errorBody = $response->json();
                if (isset($errorBody['error']['code']) && $errorBody['error']['code'] === 'model_decommissioned') {
                    continue; // Try next model
                }
                break;
            }
            $isInvalidKey = (isset($response->json()['error']['code']) && $response->json()['error']['code'] == 401);
        } elseif ($isOpenRouter) {
            // OpenRouter Logic - Using Free Models to save costs
            $response = Http::withoutVerifying()
                ->withHeaders([
                    'Authorization' => "Bearer {$apiKey}",
                    'HTTP-Referer' => 'https://o2oeg.com',
                    'X-Title' => 'O2OEG Will AI',
                    'Content-Type' => 'application/json',
                ])
                ->timeout(40)
                ->post("https://openrouter.ai/api/v1/chat/completions", [
                    'model' => 'google/gemini-flash-1.5:free', // Use the FREE version
                    'messages' => [
                        ['role' => 'user', 'content' => $prompt]
                    ]
                ]);

            if ($response->successful()) {
                $text = $response->json()['choices'][0]['message']['content'] ?? '';
                $decodedAdvice = $this->extractJson($text);
                if ($decodedAdvice) {
                    return response()->json(['success' => true, 'advice' => $decodedAdvice]);
                }
            }
            $isInvalidKey = (isset($response->json()['error']['code']) && $response->json()['error']['code'] == 401);
        } else {
            // Google Gemini Logic - Using 1.5 Updated Models
            $models = ['gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-pro', 'gemini-pro'];
            $lastError = null;
            $geminiSuccess = false;

            foreach ($models as $model) {
                try {
                    // Increased timeout to 45s to avoid cURL 28
                    $response = Http::withoutVerifying()->timeout(45)->post('https://generativelanguage.googleapis.com/v1beta/models/' . $model . ':generateContent?key=' . $apiKey, [
                        'contents' => [['parts' => [['text' => $prompt]]]]
                    ]);

                    if ($response->successful()) {
                        $text = $response->json()['candidates'][0]['content']['parts'][0]['text'] ?? '';
                        $decodedAdvice = $this->extractJson($text);
                        if ($decodedAdvice) {
                            $geminiSuccess = true;
                            return response()->json(['success' => true, 'advice' => $decodedAdvice]);
                        }
                    }
                    
                    $errorBody = $response->json();
                    Log::warning("Will AI Gemini Model {$model} failed: " . json_encode($errorBody));
                    
                    if (isset($errorBody['error']['message']) && (str_contains($errorBody['error']['message'], 'API key not valid') || str_contains($errorBody['error']['message'], 'denied access'))) {
                        $isInvalidKey = true;
                        break;
                    }
                } catch (\Exception $e) { 
                    $lastError = $e->getMessage(); 
                    Log::error("Will AI Gemini Model {$model} Exception: " . $lastError);
                }
            }

            // FALLBACK TO GROQ IF GEMINI FAILS
            if (!$geminiSuccess && config('services.groq.api_key')) {
                Log::info("Will AI: Gemini failed, falling back to Groq...");
                $groqKey = config('services.groq.api_key');
                $groqModels = ['llama-3.3-70b-versatile', 'llama-3.1-70b-8192'];
                
                foreach ($groqModels as $gModel) {
                    try {
                        $response = Http::withoutVerifying()->timeout(30)->withHeaders([
                            'Authorization' => "Bearer {$groqKey}",
                            'Content-Type' => 'application/json',
                        ])->post("https://api.groq.com/openai/v1/chat/completions", [
                            'model' => $gModel,
                            'messages' => [['role' => 'user', 'content' => $prompt]]
                        ]);

                        if ($response->successful()) {
                            $text = $response->json()['choices'][0]['message']['content'] ?? '';
                            $decodedAdvice = $this->extractJson($text);
                            if ($decodedAdvice) {
                                return response()->json(['success' => true, 'advice' => $decodedAdvice]);
                            }
                        }
                    } catch (\Exception $e) {
                        Log::error("Will AI Groq Fallback failed: " . $e->getMessage());
                    }
                }
            }
            
            // FALLBACK TO HOSTINGER OLLAMA IF GROQ FAILS
            if (!$geminiSuccess) {
                Log::info("Will AI: Trying Hostinger Local Ollama (Llama 3)...");
                try {
                    $ollamaResponse = Http::withoutVerifying()
                        ->timeout(60)
                        ->post("http://72.62.182.106:11434/api/generate", [
                            'model' => 'qwen2.5:7b',
                            'prompt' => $prompt . "\n\nImportant: Respond ONLY with a valid JSON object matching the requested format.",
                            'stream' => false,
                            'format' => 'json'
                        ]);

                    if ($ollamaResponse->successful()) {
                        $text = $ollamaResponse->json()['response'] ?? '';
                        $decodedAdvice = $this->extractJson($text);
                        if ($decodedAdvice) {
                            return response()->json(['success' => true, 'advice' => $decodedAdvice]);
                        }
                    }
                } catch (\Exception $e) {
                    Log::error("Will AI Ollama Fallback failed: " . $e->getMessage());
                }
            }
        }

        if ($isInvalidKey) {
            $simulatedAdvice = [
                'title' => 'Will AI (وضع المحاكاة) - نصيحة استراتيجية',
                'summary' => 'بناءً على نشاط صالونك الحالي، نوصي بالتركيز على الخدمات الأعلى ربحية.',
                'sections' => [
                    [
                        'heading' => 'تطوير الخدمات',
                        'content' => 'نلاحظ إقبالاً كبيراً على خدمات التلوين (Coloring). ننصح بتقديم باقة "العناية المتكاملة" بعد كل جلسة تلوين لزيادة متوسط الفاتورة بنسبة 15%.'
                    ],
                    [
                        'heading' => 'إدارة الوقت',
                        'content' => 'أيام الخميس والجمعة هي الأكثر ازدحاماً. حاول تقديم خصومات بنسبة 10% في أيام الأحد والاثنين لتوزيع ضغط الحجوزات.'
                    ],
                    [
                        'heading' => 'التفاعل مع العملاء',
                        'content' => 'لديك 20 عميلاً لم يزوروا الصالون منذ أكثر من شهر. استخدم ميزة رسائل الواتساب الآلية لإرسال كوبون "اشتقنا لك".'
                    ]
                ],
                'is_simulated' => true,
                'setup_warning' => 'برجاء إضافة GEMINI_API_KEY في ملف .env لتفعيل التحليل الفعلي لبياناتك.'
            ];

            return response()->json([
                'success' => true,
                'advice' => $simulatedAdvice
            ]);
        }

        Log::error("Will AI: All models failed", ['last_error' => $lastError ?? 'Unknown']);
        return response()->json(['message' => 'فشل في التواصل مع Will AI. يرجى التأكد من مفتاح API أو المحاولة لاحقاً.'], 500);
    }

    /**
     * استخراج الـ JSON من رد الـ AI حتى لو وجد نص قبله أو بعده
     */
    private function extractJson($text)
    {
        // البحث عن أول { وآخر }
        $startPos = strpos($text, '{');
        $endPos = strrpos($text, '}');

        if ($startPos !== false && $endPos !== false) {
            $jsonContent = substr($text, $startPos, $endPos - $startPos + 1);
            $decoded = json_decode($jsonContent, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                return $decoded;
            }
        }

        // محاولة تنظيف markdown إذا وجد
        $cleaned = str_replace(['```json', '```'], '', $text);
        $decoded = json_decode(trim($cleaned), true);
        
        return (json_last_error() === JSON_ERROR_NONE) ? $decoded : null;
    }
}

