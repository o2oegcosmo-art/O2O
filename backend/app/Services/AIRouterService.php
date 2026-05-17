<?php

namespace App\Services;

use App\Models\Tenant;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AIRouterService
{
    protected $security;

    public function __construct(AISecurityService $security)
    {
        $this->security = $security;
    }

    /**
     * الراوتر المركزي للذكاء الاصطناعي (O2OEG Multi-Brain Router)
     * يقوم بتوجيه الطلب لأفضل محرك متاح حالياً مع ضمان الاستمرارية
     */
    public function route(string $prompt, ?Tenant $tenant = null, string $feature = 'general', bool $forceJson = true)
    {
        Log::info("AIRouter: Starting routing for feature [{$feature}] for tenant [" . ($tenant->id ?? 'global') . "]");
        
        $fullPrompt = $this->security->applyShield($prompt);
        
        $activeProvider = 'none';
        $result = null;
        $lastRawText = null;
        $errors = [];

        // 1. STAGE 1: GROQ
        $groqKey = env('GROQ_API_KEY') ?: config('services.groq.api_key');
        if ($groqKey && !str_contains($groqKey, 'YOUR_')) {
            Log::info("AIRouter: Attempting Stage 1 (Groq)... Key Length: " . strlen($groqKey));
            try {
                $response = Http::timeout(10)->withHeaders([
                    'Authorization' => "Bearer {$groqKey}",
                ])->post("https://api.groq.com/openai/v1/chat/completions", [
                    'model' => 'llama-3.3-70b-versatile',
                    'messages' => [['role' => 'user', 'content' => $fullPrompt . ($forceJson ? "\n\nReturn JSON ONLY." : "")]],
                    'response_format' => $forceJson ? ['type' => 'json_object'] : null
                ]);

                if ($response->successful()) {
                    $text = $response->json()['choices'][0]['message']['content'] ?? '';
                    $lastRawText = $text;
                    $result = $forceJson ? json_decode($text, true) : $text;
                    if ($result) {
                        $activeProvider = 'groq_llama3';
                        Log::info("AIRouter: Stage 1 SUCCESS (Groq)");
                    }
                } else {
                    $errors[] = "Groq Failed: " . $response->status();
                    Log::warning("AIRouter: Groq Failed [{$response->status()}]");
                }
            } catch (\Exception $e) { 
                $errors[] = "Groq Exception: " . $e->getMessage(); 
                Log::error("AIRouter: Groq Exception: " . $e->getMessage());
            }
        }

        // 2. STAGE 2: GEMINI
        if (!$result) {
            $geminiKey = env('GEMINI_API_KEY') ?: ($tenant ? $tenant->google_ai_api_key : null);
            if ($geminiKey && !str_contains($geminiKey, 'YOUR_')) {
                Log::info("AIRouter: Attempting Stage 2 (Gemini)...");
                try {
                    $response = Http::timeout(15)->post("https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key={$geminiKey}", [
                        'contents' => [['parts' => [['text' => $fullPrompt . ($forceJson ? "\n\nReturn JSON ONLY." : "")]]]]
                    ]);
                    if ($response->successful()) {
                        $text = $response->json()['candidates'][0]['content']['parts'][0]['text'] ?? '';
                        $lastRawText = $text;
                        $result = $forceJson ? $this->extractJson($text) : $text;
                        if ($result) {
                            $activeProvider = 'gemini_flash';
                            Log::info("AIRouter: Stage 2 SUCCESS (Gemini)");
                        }
                    } else {
                        $errors[] = "Gemini Failed: " . $response->status();
                        Log::warning("AIRouter: Gemini Failed [{$response->status()}]");
                    }
                } catch (\Exception $e) { 
                    $errors[] = "Gemini Exception: " . $e->getMessage(); 
                    Log::error("AIRouter: Gemini Exception: " . $e->getMessage());
                }
            }
        }

        // 3. STAGE 3: OPENROUTER (High Reliability Backup)
        if (!$result) {
            $openRouterKey = env('OPENROUTER_API_KEY') ?: config('services.openrouter.api_key');
            if ($openRouterKey && !str_contains($openRouterKey, 'YOUR_')) {
                Log::info("AIRouter: Attempting Stage 3 (OpenRouter)...");
                try {
                    $response = Http::timeout(15)->withHeaders([
                        'Authorization' => "Bearer {$openRouterKey}",
                        'HTTP-Referer' => 'https://o2oeg.com',
                        'X-Title' => 'O2OEG Multi-Brain',
                    ])->post("https://openrouter.ai/api/v1/chat/completions", [
                        'model' => 'google/gemini-flash-1.5',
                        'messages' => [['role' => 'user', 'content' => $fullPrompt . ($forceJson ? "\n\nReturn JSON ONLY." : "")]],
                        'response_format' => $forceJson ? ['type' => 'json_object'] : null
                    ]);

                    if ($response->successful()) {
                        $text = $response->json()['choices'][0]['message']['content'] ?? '';
                        $lastRawText = $text;
                        $result = $forceJson ? $this->extractJson($text) : $text;
                        if ($result) {
                            $activeProvider = 'openrouter_gemini';
                            Log::info("AIRouter: Stage 3 SUCCESS (OpenRouter)");
                        }
                    } else {
                        $errors[] = "OpenRouter Failed: " . $response->status();
                        Log::warning("AIRouter: OpenRouter Failed [{$response->status()}]");
                    }
                } catch (\Exception $e) { 
                    $errors[] = "OpenRouter Exception: " . $e->getMessage(); 
                    Log::error("AIRouter: OpenRouter Exception: " . $e->getMessage());
                }
            }
        }

        // 4. STAGE 4: POLLINATIONS (Fast & Free - Ollama removed, too slow on VPS)
        if (!$result) {
            Log::info("AIRouter: Attempting Stage 4 (Pollinations)...");
            try {
                // Use POST to avoid 431 Header Too Large
                $r = Http::timeout(20)->post("https://text.pollinations.ai/", [
                    'messages' => [['role' => 'user', 'content' => $fullPrompt . ($forceJson ? "\n\nReturn JSON ONLY." : "")]],
                    'json' => $forceJson
                ]);
                if ($r->successful()) {
                    $text = $r->body();
                    $lastRawText = $text;
                    $result = $forceJson ? $this->extractJson($text) : $text;
                    if ($result) {
                        $activeProvider = 'pollinations_free';
                        Log::info("AIRouter: Stage 4 SUCCESS (Pollinations)");
                    }
                } else {
                    $errors[] = "Pollinations Failed: " . $r->status();
                    Log::warning("AIRouter: Pollinations Failed [{$r->status()}] Body: " . substr($r->body(), 0, 100));
                }
            } catch (\Exception $e) { 
                $errors[] = "Pollinations Exception: " . $e->getMessage(); 
                Log::error("AIRouter: Pollinations Exception: " . $e->getMessage());
            }
        }

        // Audit & Return
        if ($result) {
            $this->security->validateAndAudit($tenant, $feature, $activeProvider, $fullPrompt, $result);
            return [
                'success' => true,
                'data' => $result,
                'provider' => $activeProvider,
                'errors' => $errors
            ];
        }

        Log::error("AIRouter: ALL STAGES FAILED. Errors: " . implode(" | ", $errors));
        return [
            'success' => false,
            'errors' => $errors,
            'raw_text' => $lastRawText ?? null,
            'message' => 'All AI brains are currently unavailable.'
        ];
    }

    private function extractJson($text)
    {
        if (is_array($text)) return $text;
        $start = strpos($text, '{');
        $end = strrpos($text, '}');
        if ($start !== false && $end !== false) {
            $json = substr($text, $start, $end - $start + 1);
            $decoded = json_decode($json, true);
            if (json_last_error() === JSON_ERROR_NONE) return $decoded;
        }
        return null;
    }
}
