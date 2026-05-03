<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\WillAIService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ConsultantController extends Controller
{
    protected $consultantService;

    public function __construct(WillAIService $consultantService)
    {
        $this->consultantService = $consultantService;
    }

    public function getAdvice(Request $request)
    {
        $tenant = $request->user()->tenant;
        $prompt = $this->consultantService->buildPrompt($tenant);

        $response = Http::withoutVerifying()
            ->post('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=' . config('services.google.ai_key'), [
            'contents' => [
                ['parts' => [['text' => $prompt]]]
            ]
        ]);

        if ($response->successful()) {
            $text = $response->json()['candidates'][0]['content']['parts'][0]['text'] ?? '';
            $cleanedJson = str_replace(['```json', '```'], '', $text);
            return response()->json(json_decode(trim($cleanedJson), true));
        }

        // FALLBACK TO HOSTINGER OLLAMA
        try {
            $ollamaResponse = Http::withoutVerifying()
                ->timeout(60)
                ->post("http://72.62.182.106:11434/api/generate", [
                    'model' => 'qwen2.5:7b',
                    'prompt' => $prompt . "\n\nImportant: Respond ONLY with a valid JSON object.",
                    'stream' => false,
                    'format' => 'json'
                ]);

            if ($ollamaResponse->successful()) {
                $text = $ollamaResponse->json()['response'] ?? '';
                $cleanedJson = str_replace(['```json', '```'], '', $text);
                return response()->json(json_decode(trim($cleanedJson), true));
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Consultant Ollama Fallback failed: " . $e->getMessage());
        }

        return response()->json(['error' => 'فشل في الحصول على نصيحة المستشار'], 500);
    }
}
