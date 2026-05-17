<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CrmClient;
use App\Models\CrmOpportunity;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Services\AIRouterService;

class CrmAIController extends Controller
{
    protected $aiRouter;

    public function __construct(AIRouterService $aiRouter)
    {
        $this->aiRouter = $aiRouter;
    }
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

        // 3. استدعاء الراوتر المركزي (Multi-Brain)
        $prompt = $systemPrompt . "\n\n" . $userContext;
        $response = $this->aiRouter->route($prompt, $tenant, 'crm_consult', false);

        if ($response['success']) {
            return response()->json([
                'success' => true, 
                'analysis' => $response['data'],
                'provider' => $response['provider']
            ]);
        }

        return response()->json(['error' => 'فشل في التواصل مع محرك الذكاء الاصطناعي.'], 500);
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

