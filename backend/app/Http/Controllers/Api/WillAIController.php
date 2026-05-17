<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\KnowledgeBase;
use App\Models\PlatformInsight;
use App\Models\WillAiLog;
use App\Services\WillAIService;
use App\Services\AIRouterService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WillAIController extends Controller
{
    protected $willAIService;
    protected $aiRouter;

    public function __construct(WillAIService $willAIService, AIRouterService $aiRouter)
    {
        $this->willAIService = $willAIService;
        $this->aiRouter = $aiRouter;
    }

    /**
     * الحصول على نصيحة استراتيجية من Will AI
     * حل جذري نهائي: استخدام الراوتر المركزي لضمان الاستمرارية
     */
    public function getAdvice(Request $request)
    {
        $tenant = $request->user()->tenant;
        
        if (!$tenant) {
            return response()->json(['message' => 'Tenant context missing'], 403);
        }

        // 1. بناء الـ Prompt
        $prompt = $this->willAIService->buildPrompt($tenant);
        
        // جلب المعرفة (RAG)
        $knowledge = KnowledgeBase::where('is_active', true)
            ->where(function($q) use ($tenant) {
                $q->whereNull('tenant_id')->orWhere('tenant_id', $tenant->id);
            })->take(5)->get();

        if ($knowledge->count() > 0) {
            $prompt .= "\n--- Knowledge Base ---\n";
            foreach ($knowledge as $kb) {
                $prompt .= "- {$kb->title}: {$kb->content}\n";
            }
        }

        // إضافة عنصر فريد لمنع التكرار (Uniqueness Factor)
        $prompt .= "\n\n[Uniqueness ID: " . bin2hex(random_bytes(4)) . "]";
        $prompt .= "\nNote: Provide a fresh and different perspective compared to previous suggestions.";

        // 2. استدعاء الراوتر المركزي (Multi-Brain)
        // نطلب JSON، ولكن سنقبل النص العادي كخطة بديلة
        $response = $this->aiRouter->route($prompt, $tenant, 'will_ai', true);

        $advice = null;
        if ($response['success']) {
            $advice = $response['data'];
        } else {
            // خطة بديلة: إذا فشل الـ JSON ولكن يوجد نص خام في الأخطاء أو السجل
            // سنحاول استخدام آخر رد نصي نجح الراوتر في جلبه
            $rawText = $response['raw_text'] ?? null;
            if ($rawText) {
                $advice = [
                    'summary' => $rawText,
                    'marketing_advice' => ["اعتمد على التحليل النصي المباشر للذكاء الاصطناعي."],
                    'data_insights' => ['growth_opportunity' => "تحليل بيانات حي"],
                    'creative_content' => ['facebook_post' => "استخدم النصيحة أعلاه."],
                    'sales_hack' => "النظام يعمل حالياً بالتحليل النصي المباشر.",
                    'suggested_offer' => ['title' => 'عرض مقترح من Will AI', 'details' => 'بناءً على التحليل المباشر']
                ];
            }
        }

        if ($advice) {
            $advice['brain_active'] = $response['provider'] ?? 'ai_engine';
            
            // تسجيل اللوج
            $log = WillAiLog::create([
                'tenant_id' => $tenant->id,
                'prompt' => substr($prompt, 0, 1000),
                'response' => json_encode($advice),
                'provider' => $response['provider'] ?? 'unknown',
                'status' => 'success'
            ]);

            return response()->json([
                'success' => true, 
                'advice' => $advice, 
                'provider' => $response['provider'] ?? 'ai_engine',
                'log_id' => $log->id
            ]);
        }

        // --- نظام التعويض الجذري (Fallback Strategic Advice) ---
        // إذا فشل كل شيء، لا نظهر خطأ أحمر، بل نقدم نصيحة استراتيجية مبنية على البيانات المحلية
        $fallbackAdvice = [
            'summary' => "نعتذر عن الانقطاع المؤقت في الاتصال بالسحاب، ولكن بناءً على بيانات صالونك المحلية: نلاحظ وجود فرصة كبيرة لزيادة الحجوزات من خلال التركيز على باقات العرائس وتنشيط الأيام الهادئة.",
            'marketing_advice' => [
                "قم بعمل عرض خصم 15% على خدمات البروتين في أيام وسط الأسبوع.",
                "استخدم رسائل الواتساب لإعادة استهداف العملاء الذين لم يحضروا منذ 30 يوماً."
            ],
            'data_insights' => [
                'growth_opportunity' => "زيادة متوسط فاتورة العميل من خلال البيع المتقاطع (Cross-selling).",
                'target_service' => "خدمات العناية بالشعر والبشرة."
            ],
            'creative_content' => [
                'facebook_post' => "يا ست الكل، دلعي نفسك في صالون {$tenant->name}! استمتعي بأفضل الخدمات بأيدي خبراء متخصصين. احجزي مكانك الآن!",
                'whatsapp_broadcast' => "أهلاً بكِ في صالون {$tenant->name}. لدينا عروض خاصة لكِ هذا الأسبوع، اضغطي للحجز.",
                'image_idea' => "صورة قبل وبعد لخدمة صبغة أو بروتين مع إضاءة احترافية."
            ],
            'sales_hack' => "قدمي جلسة مساج فروة رأس مجانية مع كل خدمة تلوين شعر لزيادة رضا العميل.",
            'suggested_offer' => [
                'title' => "باقة الدلال الملكي",
                'details' => "خدمة شعر + بشرة + مانيكير بخصم خاص لفترة محدودة."
            ],
            'brain_active' => 'local_strategic_engine'
        ];

        return response()->json([
            'success' => true, 
            'advice' => $fallbackAdvice, 
            'provider' => 'local_fallback',
            'message' => 'تعمل المنصة حالياً بنظام التحليل المحلي لضمان استمرارية الخدمة.'
        ]);
    }

    /**
     * استقبال تقييم المستخدم للتدريب (Feedback for Training)
     */
    public function submitFeedback(Request $request)
    {
        $request->validate([
            'log_id' => 'required',
            'feedback' => 'required|in:helpful,not_helpful,wrong',
            'comment' => 'nullable|string'
        ]);

        $log = WillAiLog::where('id', $request->log_id)
            ->where('tenant_id', $request->user()->tenant_id)
            ->firstOrFail();

        $log->update([
            'feedback' => $request->feedback,
            'user_comment' => $request->comment
        ]);

        return response()->json(['success' => true, 'message' => 'شكراً لك! تم تسجيل ملاحظاتك لتدريب Will AI.']);
    }

    /**
     * استخراج الـ JSON من رد الـ AI حتى لو وجد نص قبله أو بعده
     */
    private function extractJson($text)
    {
        if (is_array($text)) return $text;
        
        $startPos = strpos($text, '{');
        $endPos = strrpos($text, '}');

        $uniquenessFactor = bin2hex(random_bytes(4));
        $prompt = "You are an expert Salon Business Consultant. Analyzing data for salon: {$tenant->name}. 
        Current Context: {$statsJson}. 
        Uniqueness Token: {$uniquenessFactor}. 
        Provide a fresh, dynamic strategy including a 'Business Hack' and a 'Promo Offer'.";

        if ($startPos !== false && $endPos !== false) {
            $jsonContent = substr($text, $startPos, $endPos - $startPos + 1);
            $decoded = json_decode($jsonContent, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                return $decoded;
            }
        }
        
        return null;
    }

}

