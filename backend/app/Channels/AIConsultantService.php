<?php

namespace App\Services;

use App\Models\Tenant;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AIConsultantService
{
    /**
     * بناء الـ Prompt المتكامل للمستشار
     */
    public function buildConsultancyPrompt(Tenant $tenant)
    {
        $stats = $this->getTenantStats($tenant);
        $now = Carbon::now()->format('Y-m-d');
        $egyptianContext = $this->getEgyptianMarketContext();

        return "
أنت الآن 'كبير مستشاري الأعمال' في منصة O2OEG، خبير متخصص في قطاع التجميل المصري.
مهمتك: تحليل بيانات الصالون '{$tenant->name}' وتقديم نصائح تسويقية واستراتيجية لزيادة المبيعات (MRR).

--- أولاً: بيانات الصالون الحالية ({$now}) ---
- إجمالي الحجوزات هذا الشهر: {$stats['bookings_count']}
- الخدمة الأكثر طلباً: {$stats['top_service']}
- إجمالي الإيرادات المحققة: {$stats['revenue']} جنيه مصري
- نسبة العملاء الجدد: {$stats['new_customers_rate']}%

--- ثانياً: سياق السوق المصري الحالي ---
{$egyptianContext}

--- ثالثاً: القواعد الإلزامية للرد ---
1. استخدم اللهجة المصرية البيضاء (المفهومة والودودة) في التوصيات.
2. ركز على استراتيجيات تناسب القدرة الشرائية الحالية (عروض باقات، خصومات ساعات الهدوء، أو هدايا عينية).
3. اقترح أفكاراً للتسويق عبر 'حالات الواتساب' و 'Instagram Reels' لأنها الأكثر تأثيراً في مصر.
4. إذا وجد موسم قريب (مثل: عيد الفطر، عيد الأضحى، موسم الأفراح الصيفي، أو الفلانتين)، يجب أن تكون النصيحة مرتبطة به.

--- رابعاً: هيكل الرد المطلوب (JSON) ---
{
    \"summary\": \"تحليل سريع للوضع الحالي\",
    \"marketing_advice\": [\"نصيحة 1\", \"نصيحة 2\"],
    \"sales_hack\": \"فكرة لزيادة المبيعات فوراً\",
    \"suggested_whatsapp_status\": \"نص مقترح لنشره على واتساب لجذب الزبائن\"
}
";
    }

    private function getTenantStats(Tenant $tenant)
    {
        return [
            'bookings_count' => $tenant->bookings()->whereMonth('created_at', now()->month)->count(),
            'revenue' => $tenant->bookings()->where('status', 'completed')->sum('price'),
            'top_service' => DB::table('bookings')
                ->join('services', 'bookings.service_id', '=', 'services.id')
                ->where('bookings.tenant_id', $tenant->id)
                ->select('services.name', DB::raw('count(*) as total'))
                ->groupBy('services.name')
                ->orderByDesc('total')
                ->first()?->name ?? 'غير محدد بعد',
            'new_customers_rate' => 35 // قيمة افتراضية حتى نربطها بمعادلة حقيقية
        ];
    }

    private function getEgyptianMarketContext()
    {
        // هذه البيانات يمكن جلبها من قاعدة بيانات مركزية للمنصة أو تحديثها دورياً
        return "- نحن الآن في " . (now()->month >= 6 && now()->month <= 9 ? "ذروة موسم الأفراح والمناسبات الصيفية" : "فترة المدارس/الشتاء") . ".
- توجه المستهلك المصري حالياً يميل للبحث عن 'القيمة مقابل السعر' بسبب التضخم.
- استخدام 'انستا باي' و 'فودافون كاش' أصبح وسيلة دفع مفضلة للعملاء لضمان الحجز.";
    }
}
