<?php

namespace App\Services;

use App\Models\Tenant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AISecurityService
{
    /**
     * القواعد العسكرية المركزية لنقاء اللغة وحماية النظام
     */
    public const MILITARY_SHIELD_PROMPT = "
--- LINGUISTIC GUIDANCE: EGYPTIAN BRAND VOICE ---
1. LANGUAGE: Professional Egyptian Colloquial (عامية مصرية بيضاء محترفة).
2. TONE: Friendly, premium, and welcoming.
3. SCRIPT: Use Arabic script primarily. Brand names can stay in English if needed.
4. QUALITY: Avoid repeating characters or hallucinating symbols. 
5. IDENTITY: You are the AI Marketing Assistant for O2OEG Platform.
";

    /**
     * تطبيق الدرع اللغوي على الطلب المرسل للذكاء الاصطناعي
     */
    public function applyShield(string $prompt): string
    {
        return self::MILITARY_SHIELD_PROMPT . "\n\n" . $prompt;
    }

    /**
     * فحص الرد وتدقيقه أمنياً ولغوياً
     */
    public function validateAndAudit(?Tenant $tenant, string $feature, string $model, string $prompt, $response)
    {
        $responseText = is_array($response) ? json_encode($response, JSON_UNESCAPED_UNICODE) : (string)$response;
        
        // التحقق من الهلوسة اللغوية (وجود حروف غير عربية في نصوص يفترض أنها عربية)
        // نطاق البحث: الحروف اللاتينية (a-z)، الصينية، الروسية
        $isHallucination = preg_match('/[a-zA-Z\x{4e00}-\x{9fa5}\x{0400}-\x{04FF}]/u', $responseText);

        // تسجيل العملية في سجل الرقابة
        DB::table('ai_audit_logs')->insert([
            'tenant_id' => $tenant ? $tenant->id : null,
            'feature' => $feature,
            'model' => $model,
            'prompt_sent' => $prompt,
            'response_received' => $responseText,
            'is_hallucination' => (bool)$isHallucination,
            'security_flags' => json_encode([
                'injection_attempt' => str_contains(strtolower($prompt), 'ignore previous instructions'),
            ]),
            'tokens_estimated' => strlen($prompt . $responseText) / 4, // تقدير تقريبي
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return [
            'is_valid' => !$isHallucination,
            'content' => $response
        ];
    }

    /**
     * فحص الرسالة الواردة من العميل لمنع حقن الأوامر
     */
    public function sanitizeInboundMessage(string $message): string
    {
        $message = strip_tags($message);
        $message = mb_substr($message, 0, 1000); // تحديد طول الرسالة
        
        // كلمات مشبوهة قد تستخدم في الـ Prompt Injection
        $suspiciousPatterns = [
            'ignore previous',
            'forget all instructions',
            'system prompt',
            'developer mode',
            'override'
        ];

        foreach ($suspiciousPatterns as $pattern) {
            if (str_contains(strtolower($message), $pattern)) {
                Log::warning("Potential Prompt Injection Attempt Blocked", ['message' => $message]);
                return "[SECURITY BLOCK: Potential Injection Attempt]";
            }
        }

        return $message;
    }
}

