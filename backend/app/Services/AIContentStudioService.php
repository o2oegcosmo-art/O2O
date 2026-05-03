<?php

namespace App\Services;

use App\Models\ContentCalendar;
use App\Models\ContentPost;
use App\Models\Tenant;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AIContentStudioService
{
    protected $security;

    public function __construct(AISecurityService $security)
    {
        $this->security = $security;
    }

    private function getCustomerStyleContext(Tenant $tenant = null)
    {
        if (!$tenant) return "";
        try {
            $messages = \DB::table('messages')
                ->where('tenant_id', $tenant->id)
                ->where('direction', 'outbound')
                ->orderBy('created_at', 'desc')
                ->limit(30)
                ->pluck('message_body')
                ->toArray();

            if (empty($messages)) return "";

            $context = "\n--- CUSTOMER STYLE SYNC (مزامنة اسلوب العميل) ---\n";
            $context .= "The following are real previous messages sent by this business to their customers. Study their dialect, tone, and vocabulary carefully and IMITATE them perfectly:\n";
            foreach ($messages as $msg) {
                $context .= "- " . $msg . "\n";
            }
            return $context;
        } catch (\Exception $e) {
            return "";
        }
    }

    private function callGemini($prompt, Tenant $tenant = null, $feature = 'content_studio')
    {
        // Skip style context for marketing to avoid imitating old receptionist messages
        $styleContext = ($feature === 'whatsapp_marketing' || $feature === 'crm_marketing') ? "" : $this->getCustomerStyleContext($tenant);
        
        $shieldedPrompt = $this->security->applyShield($prompt . $styleContext);
        $fullPrompt = $shieldedPrompt . ($styleContext ? "\n\nSTRICT REQUIREMENT: Ensure the output matches the 'Customer Style Sync' tone." : "");

        $apiKey = $tenant ? $tenant->google_ai_api_key : null;
        if (!$apiKey) {
            $apiKey = config('services.google_ai.api_key');
        }
        
        $groqKey = config('services.groq.api_key');
        $geminiModels = ['gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-pro', 'gemini-pro'];

        $lastError = '';
        $geminiSuccess = false;

        // 1. Try Gemini Models
        if ($apiKey && $apiKey !== 'YOUR_API_KEY_HERE') {
            foreach ($geminiModels as $model) {
                try {
                    $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";
                    
                    // Increased timeout to 45s
                    $response = Http::withoutVerifying()->timeout(45)->post($url, [
                        'contents' => [['parts' => [['text' => $fullPrompt]]]],
                        'generationConfig' => ['response_mime_type' => 'application/json']
                    ]);

                    if ($response->successful()) {
                        $jsonString = $response->json('candidates.0.content.parts.0.text');
                        $jsonString = str_replace(['```json', '```'], '', $jsonString);
                        $result = json_decode(trim($jsonString), true);
                        
                        if ($result) {
                            $geminiSuccess = true;
                            $this->security->validateAndAudit($tenant, $feature, $model, $fullPrompt, $result);
                            return $result;
                        }
                    }
                    
                    $errorBody = $response->json();
                    Log::warning("AIContentStudio Gemini Model {$model} failed: " . json_encode($errorBody));
                    $lastError = $response->body();

                    // If access denied or invalid key, break Gemini loop and go to Groq
                    if (isset($errorBody['error']['message']) && (str_contains($errorBody['error']['message'], 'denied access') || str_contains($errorBody['error']['message'], 'API key not valid'))) {
                        break;
                    }
                } catch (\Exception $e) {
                    $lastError = $e->getMessage();
                    Log::error("AIContentStudio Gemini Exception: " . $lastError);
                }
            }
        }

        // 2. Try Groq Fallback
        if (!$geminiSuccess && $groqKey && $groqKey !== 'YOUR_GROQ_KEY_HERE') {
            Log::info("AIContentStudio: Gemini failed, falling back to Groq...");
            try {
                $groqResponse = Http::withoutVerifying()->timeout(30)
                    ->withHeaders(['Authorization' => "Bearer " . $groqKey])
                    ->post("https://api.groq.com/openai/v1/chat/completions", [
                        'model' => config('services.groq.model', 'llama-3.3-70b-versatile'),
                        'messages' => [
                            ['role' => 'system', 'content' => "You are a Social Media expert. Return JSON ONLY."],
                            ['role' => 'user', 'content' => $fullPrompt]
                        ],
                        'response_format' => ['type' => 'json_object']
                    ]);

                if ($groqResponse->successful()) {
                    $text = $groqResponse->json('choices.0.message.content');
                    $result = json_decode($text, true);
                    if ($result) {
                        $this->security->validateAndAudit($tenant, $feature, config('services.groq.model'), $fullPrompt, $result);
                        return $result;
                    }
                }

                $lastError = $groqResponse->body();
            } catch (\Exception $e) {
                Log::error("AIContentStudio Groq Fallback failed: " . $e->getMessage());
                $lastError = $e->getMessage();
            }
        }
        
        // 3. Try Hostinger Local Ollama Fallback
        if (!$geminiSuccess) {
            Log::info("AIContentStudio: Trying Hostinger Local Ollama (Llama 3)...");
            try {
                $ollamaResponse = Http::withoutVerifying()->timeout(60)
                    ->post("http://72.62.182.106:11434/api/generate", [
                        'model' => 'llama3',
                        'prompt' => $fullPrompt . "\n\nImportant: Respond ONLY with a valid JSON object.",
                        'stream' => false,
                        'format' => 'json'
                    ]);

                if ($ollamaResponse->successful()) {
                    $text = $ollamaResponse->json('response');
                    $result = json_decode($text, true);
                    
                    if (!$result && is_string($text)) {
                         // Robust JSON extraction using Regex to find the first { and last }
                         if (preg_match('/\{(?:[^{}]|(?R))*\}/s', $text, $matches)) {
                             $result = json_decode($matches[0], true);
                         }
                         
                         // Second attempt: if still null, try simpler extraction
                         if (!$result) {
                             $startPos = strpos($text, '{');
                             $endPos = strrpos($text, '}');
                             if ($startPos !== false && $endPos !== false) {
                                 $jsonContent = substr($text, $startPos, $endPos - $startPos + 1);
                                 $result = json_decode($jsonContent, true);
                             }
                         }
                    }

                    if ($result) {
                        $this->security->validateAndAudit($tenant, $feature, 'ollama-llama3', $fullPrompt, $result);
                        return $result;
                    }
                }
                $lastError = $ollamaResponse->body();
            } catch (\Exception $e) {
                Log::error("AIContentStudio Ollama Fallback failed: " . $e->getMessage());
                $lastError = $e->getMessage();
            }
        }

        throw new \Exception('فشل التواصل مع جميع محركات الذكاء الاصطناعي. السبب الأخير: ' . $lastError);
    }

    public function generateWeeklyPlan(Tenant $tenant)
    {
        // 1. Fetch some basic insights about the tenant to feed the AI
        $businessCategory = $tenant->business_category ?? 'Salon/Clinic';
        
        // Force salon context if it's admin or missing to avoid "Digital Marketing" hallucinations
        if (in_array(strtolower($businessCategory), ['admin', 'management', 'hub', 'o2oeg'])) {
            $businessCategory = 'صالون تجميل نسائي وحلاقة رجالي احترافية';
        }

        $prompt = "
        You are an expert Social Media Manager for a {$businessCategory} in Egypt.
        Create a 7-day social media content plan.
        
        - TOPICS: ONLY about beauty, hair, skin, and salon services. Do NOT talk about digital marketing, photography, or general skills.

        
        Return ONLY a JSON array with 7 objects, each having:
        - 'day': String (e.g., 'Monday')
        - 'platform': String (facebook, instagram, tiktok, whatsapp)
        - 'post_type': String (offer, tips, educational, trend, before_after)
        - 'title': String (A short catchy idea title in ARABIC)
        ";

        $ideas = $this->callGemini($prompt, $tenant);

        // Validation Layer: Detect non-Arabic scripts in titles
        if (is_array($ideas)) {
            foreach ($ideas as $key => $idea) {
                if (isset($idea['title']) && preg_match('/[a-zA-Z\x{4e00}-\x{9fa5}\x{0400}-\x{04FF}]/u', $idea['title'])) {
                    // Hallucination detected (English, Chinese, or Russian characters found)
                    // We'll try to fix it or just set a safe default
                    $ideas[$key]['title'] = "عرض مميز للعناية بالجمال";
                }
            }
        }

        // If AI wrapped the array in an object (e.g. {"ideas": [...]}), unwrap it
        if (is_array($ideas) && !isset($ideas[0]) && count($ideas) > 0) {
            $firstKey = array_key_first($ideas);
            if (is_array($ideas[$firstKey])) {
                $ideas = $ideas[$firstKey];
            }
        }

        if (!is_array($ideas) || empty($ideas)) {
            throw new \Exception('Invalid response format from AI: Expected array of ideas.');
        }

        // Create the calendar
        $calendar = ContentCalendar::create([
            'tenant_id' => $tenant->id,
            'week_start_date' => now()->startOfWeek(),
            'status' => 'draft'
        ]);

        // Create the posts
        foreach ($ideas as $idea) {
            if (!is_array($idea)) continue;
            
            ContentPost::create([
                'tenant_id' => $tenant->id,
                'calendar_id' => $calendar->id,
                'platform' => $idea['platform'] ?? 'instagram',
                'post_type' => $idea['post_type'] ?? 'tips',
                'title' => $idea['title'] ?? 'فكرة محتوى جديدة',
                'status' => 'idea'
            ]);
        }

        return $calendar->load('posts');
    }

    public function generatePostContent(ContentPost $post)
    {
        $tenant = $post->tenant;
        $businessCategory = $tenant->business_category ?? 'Salon';
        
        $prompt = "
        You are an expert Egyptian Copywriter. Write a highly engaging social media post.
        Post Title Idea: {$post->title}
        Platform: {$post->platform}
        Type: {$post->post_type}
        
        Guidelines:

        - Use emojis to make it friendly.
        - Use a friendly Egyptian tone (White dialect).
        - Include a strong Call to Action (CTA) at the end.
        
        Return ONLY a JSON object with:
        - 'caption': The full engaging text in Arabic.
        - 'hashtags': Space separated Arabic hashtags relevant to the topic.
        - 'image_prompt': A professional image generation prompt (in English) for this post.
        ";

        $result = $this->callGemini($prompt, $tenant);

        // Validation Layer: Prevent Linguistic Distortion
        if (is_array($result) && isset($result['caption'])) {
            if (preg_match('/[a-zA-Z\x{4e00}-\x{9fa5}\x{0400}-\x{04FF}]/u', $result['caption'])) {
                // If distortion detected, we don't return the distorted content
                $result['caption'] = "عذراً، جاري إعادة صياغة المحتوى لضمان الجودة...";
            }
        }

        if ($result) {
            $post->update([
                'content_text' => $result['caption'] ?? '',
                'hashtags' => $result['hashtags'] ?? '',
                'image_prompt' => $result['image_prompt'] ?? '',
                'status' => 'generated'
            ]);
        }

        return $post;
    }

    public function generateAdsAdvice(ContentPost $post)
    {
        $prompt = "
        You are a Media Buyer expert. I have this post for my business:
        Title: {$post->title}
        Content: {$post->content_text}
        
        Give me a strategy to run this as a sponsored ad.
        Return ONLY a JSON object with:
        - 'objective': Recommended campaign objective (e.g. Engagement, Messages, Leads)
        - 'audience': Brief target audience description.
        - 'budget_suggestion': Suggested daily budget strategy.
        - 'tips': One important tip for success.
        ";

        $advice = $this->callGemini($prompt, $post->tenant);

        if ($advice) {
            $post->update([
                'advice_json' => $advice
            ]);
        }

        return $advice;
    }

    public function generateWhatsAppMessage(Tenant $tenant, $goal, $service)
    {
        $prompt = "
        You are an expert PROACTIVE MARKETING COPYWRITER for a salon in Egypt.
        Write a short, highly engaging WhatsApp BROADCAST message for a marketing campaign.
        
        --- CONTEXT ---
        - This is a PROACTIVE message to an EXISTING client who is NOT currently talking to us.
        - DO NOT start with 'Thank you for contacting us' or 'How can I help you?'.
        - DO NOT act like a receptionist or chatbot.
        - Act like a premium brand reaching out to its valued clients with an exclusive offer.
        
        --- DETAILS ---
        Campaign Goal: {$goal}
        Target Service: {$service}
        Tone: Enthusiastic, catchy, and professional (Egyptian Arabic).

        --- REQUIREMENTS ---
        - Start with a warm greeting or a catchy hook relevant to the service.
        - Mention the benefit/offer clearly.
        - Include a clear Call to Action (CTA) like 'لحجز مكانك ردي علينا' or 'احجزي الآن'.
        - IMPORTANT: End the message with 'لإيقاف الرسائل اكتب إلغاء' as an opt-out mechanism.
        
        Return ONLY a JSON object with:
        - 'message': The full WhatsApp message text in Arabic.
        ";

        $result = $this->callGemini($prompt, $tenant, 'whatsapp_marketing');

        return $result['message'] ?? '';
    }

    public function generateSocialPost(Tenant $tenant, $businessType, $goal, $details, $tone)
    {
        $prompt = "
        You are a Social Media expert for a {$businessType} in Egypt.
        Create an engaging post.
        Goal: {$goal}
        Details: {$details}
        Tone: {$tone}

        
        Return ONLY a JSON object with:
        - 'caption': The text to post.
        - 'hashtags': Space separated Arabic hashtags.
        - 'cta': A short Egyptian Arabic call to action.
        ";

        return $this->callGemini($prompt, $tenant);
    }

    public function generateReelScript(Tenant $tenant, $service, $offer, $target)
    {
        $prompt = "
        Write a short video script for an Instagram Reel for a salon in Egypt.
        Service: {$service}
        Offer: {$offer}
        Target Audience: {$target}

        
        Return ONLY a JSON object with:
        - 'hook': A catchy text overlay for the first 3 seconds in Arabic.
        - 'scenes': An array of strings describing 3-4 short video scenes.
        - 'caption': The caption to post along with the video in Arabic.
        - 'hashtags': Arabic hashtags.
        ";

        return $this->callGemini($prompt, $tenant);
    }

    public function generateProductDescription(Tenant $tenant, $productName, $targetAudience = 'salons')
    {
        $prompt = "
        You are a Marketing Expert for a beauty supply company in Egypt.
        Write a professional and persuasive product description for: {$productName}
        Target Audience: {$targetAudience}

        Guidelines:
        - Use a premium, professional tone.
        - Highlight the benefits for the business owner (ROI, quality, customer satisfaction).
        - Use Egyptian Arabic (Professional/White dialect).
        
        Return ONLY a JSON object with:
        - 'title': A catchy marketing title.
        - 'description': The full product story/description.
        - 'features': An array of 3 key features.
        - 'cta': A strong call to action.
        ";

        return $this->callGemini($prompt, $tenant, 'product_marketing');
    }

    public function generateCustomPost(Tenant $tenant, $topic, $platform = 'Instagram', $tone = 'professional')
    {
        $prompt = "
        Write a social media post for a beauty salon.
        Topic: {$topic}
        Platform: {$platform}
        Tone: {$tone}
        
        Return ONLY a JSON object with:
        - 'caption': The post text in Arabic (Egyptian dialect, friendly but professional tone).
        - 'hashtags': 5-7 relevant Arabic hashtags.
        - 'image_prompt': A detailed English description for an AI image generator (photorealistic, high quality).
        ";

        $result = $this->callGemini($prompt, $tenant);

        if (!$result) {
            return [
                'content_text' => "عذراً، جاري إعادة صياغة المحتوى لضمان الجودة...",
                'hashtags' => "#O2OEG #جمال #صالون #شعر #بشرة",
                'image_prompt' => "Generate a professional image of a woman with healthy skin and hair, smiling and holding a water bottle, with a salon background"
            ];
        }

        return [
            'content_text' => $result['caption'] ?? '',
            'hashtags' => $result['hashtags'] ?? '',
            'image_prompt' => $result['image_prompt'] ?? '',
            'status' => 'generated'
        ];
    }

    public function generateAdsStrategy(Tenant $tenant)
    {
        $prompt = "
        You are a Senior Ads Strategist for the beauty industry in Egypt.
        Design a professional Meta (Facebook/Instagram) ads strategy for: {$tenant->name}.
        
        Return ONLY a JSON object with:
        - 'strategy': An array of 3 objects, each with:
            - 'title': (e.g., Target Audience, Budget Plan, Creative Direction)
            - 'description': Detailed advice in Arabic (Egyptian dialect, professional).
        ";

        $result = $this->callGemini($prompt, $tenant, 'ads_strategy');

        if (!$result) {
            return [
                'strategy' => [
                    ['title' => 'الجمهور المستهدف', 'description' => 'ركز على السيدات في النطاق الجغرافي للصالون (5-10 كم) المهتمات بالتجميل والعناية بالشعر.'],
                    ['title' => 'الميزانية المقترحة', 'description' => 'ابدأ بميزانية 200-500 جنيهاً يومياً لمدة 7 أيام لاختبار أفضل المنشورات أداءً.'],
                    ['title' => 'التوجه الإبداعي', 'description' => 'استخدم فيديوهات قصيرة (Reels) تظهر نتائج حقيقية (قبل وبعد) لجذب الانتباه بسرعة.']
                ]
            ];
        }

        return $result;
    }
}
