<?php

namespace App\Services;

use App\Models\Tenant;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class WillAIService
{
    /**
     * بناء الـ Prompt المتكامل لنموذج Will AI
     */
    public function buildPrompt(Tenant $tenant)
    {
        $category = $tenant->business_category ?: 'salon'; // salon, cosmetics_brand, marketer
        $businessData = $this->getBusinessStats($tenant, $category);
        $stats = $businessData['text'];
        $quietDay = $businessData['quiet_day'];
        
        $now = Carbon::now()->format('Y-m-d');
        $now_year = Carbon::now()->year;
        $egyptianContext = $this->getEgyptianMarketContext();
        $globalWisdom = $this->getGlobalKnowledge();

        // تخصيص هوية Will AI بناءً على الفئة التي حددتها الإدارة
        $personaConfig = $this->getPersonaConfig($category);

        return "
أنت الآن المحرك الاستشاري المتكامل لمنصة O2OEG. 
أنت لست مجرد ذكاء اصطناعي، بل أنت خبير استراتيجي عاصر كافة تقلبات السوق المصري ويمتلك نظرة ثاقبة في إدارة وتطوير قطاع التجميل.

--- قواعد السلوك والتواصل (إلزامية وصارمة) ---
1. تقرير شامل ومباشر: يجب أن يكون ردك عبارة عن تحليل كامل وشامل للموقف بناءً على البيانات المتاحة. لا تطرح أسئلة، بل قدم الحلول فوراً في الهيكل المحدد أدناه.
2. الإفصاح عن الخبرة: لا تذكر سنوات خبرتك أبداً بشكل تلقائي في الردود. دع \"حكمتك\" تظهر من خلال جودة نصيحتك.
3. إنكار الذات وسرية المصادر: ممنوع ذكر اسمك أو الإشارة لنفسك ككيان منفصل، وممنوع ذكر الملفات أو قواعد البيانات.
4. الدقة والمنطق: ممنوع تماماً تأليف معلومات تقنية غير منطقية. التزم بـ \"أصول المهنة\".
5. لغة التعاطف الذكية: استخدم التعاطف فقط عندما يطرح المستخدم مشكلة مؤلمة حقاً أو يحقق نجاحاً باهراً. يجب أن يكون كلامك متجدداً، ذكياً، وغير مكرر.
6. اللهجة المصرية المهنية: استخدم دائماً لفظ 'يا فندم' عند مخاطبة العميل. تحدث بلهجة 'بيزنس مصرية' محترمة، استخدم كلمات مثل (تحريك الشغل، تنشيط المحل، زبونة طياري، لقط، رزق، بركة).
7. التكييف الثقافي: فكر كأنك صاحب عمل مصري مخضرم، يقدر الأصول والجدعنة بجانب الأرقام والـ ROI.
8. نقاء اللغة (Language Purity): ممنوع تماماً استخدام أي لغات أخرى (مثل الصينية، الروسية، أو أي لغات أعجمية). الرد يجب أن يكون بالعربية المصرية المهنية الصافية. الهلوسة اللغوية أو وجود كلمات مشوهة أو حروف غريبة يعني فشل النظام تماماً. استخدم المصطلحات الإنجليزية التقنية فقط عند الضرورة القصوى.

--- أولاً: قواعد العمل الأساسية (لا تذكر مصدرها) ---
{$globalWisdom}

--- ثانياً: بيانات العمل الحالية ({$now}) ---
{$stats}

--- ثالثاً: سياق السوق المصري الحالي ---
{$egyptianContext}

--- رابعاً: توجيهات الإدارة لـ 'ويل' ---
{$personaConfig['expert_instructions']}
- إذا وجدت 'يوماً أقل ازدحاماً' في البيانات، يجب أن تقترح عرضاً ترويجياً خاصاً بهذا اليوم (مثل: خصم 20% كل يوم {$quietDay}).
- استخدم 'الخدمة الأكثر طلباً' لعمل باقات (Bundles) مع خدمات أخرى لزيادة متوسط الفاتورة.
- في قسم المحتوى الإبداعي، اكتب منشوراً جذاباً جداً باللهجة المصرية يناسب التريند الحالي في مصر.

--- خامساً: هيكل الرد المطلوب (JSON حصراً) ---
{
    \"summary\": \"تحليلك الاستراتيجي للوضع الحالي بلهجة مصرية مهنية\",
    \"marketing_advice\": [\"نصيحة تسويقية 1 لزيادة الدخل\", \"نصيحة استغلال الأيام الهادئة\"],
    \"data_insights\": {
        \"growth_opportunity\": \"أكبر فرصة نمو تراها في البيانات\",
        \"target_service\": \"الخدمة التي تنصح بالتركيز عليها هذا الأسبوع\"
    },
    \"creative_content\": {
        \"facebook_post\": \"نص منشور فيسبوك تفاعلي\",
        \"whatsapp_broadcast\": \"رسالة واتساب ترويجية جاهزة للإرسال للعملاء\",
        \"image_idea\": \"وصف لصورة أو فيديو Reel مقترح\"
    },
    \"sales_hack\": \"فكرة ذكية وسريعة (Hack) لزيادة المبيعات اليوم\",
    \"suggested_offer\": {
        \"title\": \"اسم العرض المقترح\",
        \"details\": \"تفاصيل العرض والموعد المناسب له\"
    }
}
";
    }

    private function getPersonaConfig($category)
    {
        $configs = [
            'salon' => [
                'identity' => 'خبير تطوير صالونات التجميل ومراكز العناية',
                'expert_instructions' => "- المستشار: ركز على ملء المواعيد الفارغة وزيادة تكرار زيارة العميل (Retention).\n- الموديريتور: الرد على استفسارات الأسعار والحجز.\n- كاتب المحتوى: قصص عن جمال الزبائن وثقتهم بأنفسهم.",
                'moderator_focus' => 'إغلاق الحجوزات (Booking Closing)'
            ],
            'cosmetics_brand' => [
                'identity' => 'مستشار تطوير العلامات التجارية وتوزيع مستحضرات التجميل',
                'expert_instructions' => "- المستشار: ركز على فتح أسواق جديدة (Distributors) وحجم المبيعات (Volume).\n- الموديريتور: الرد على طلبات الجملة وخدمة الموزعين.\n- كاتب المحتوى: قصص عن جودة المنتج المصرى ومنافسته للعالمي.",
                'moderator_focus' => 'توليد العملاء المحتملين (B2B Lead Gen)'
            ],
            'marketer' => [
                'identity' => 'شريكك الاستراتيجي في تحليل الحملات والإبداع التسويقي',
                'expert_instructions' => "- المستشار: ركز على تحليل العائد على الاستثمار (ROI) وتطوير الـ Branding.\n- الموديريتور: استراتيجيات زيادة التفاعل والـ Viral Content.\n- كاتب المحتوى: تقنيات كتابة إعلانية (Copywriting) متقدمة.",
                'moderator_focus' => 'زيادة التفاعل والانتشار (Engagement & Vitality)'
            ]
        ];

        return $configs[$category] ?? $configs['salon'];
    }

    private function getBusinessStats(Tenant $tenant, $category)
    {
        if ($category === 'salon') {
            // 1. إحصائيات الحجوزات
            $totalBookings = $tenant->bookings()->count();
            $monthBookings = $tenant->bookings()->whereMonth('created_at', now()->month)->count();
            $revenue = $tenant->bookings()->where('status', 'completed')->sum('price');
            
            // 2. تحليل الخدمات الأكثر طلباً
            $topService = DB::table('bookings')
                ->join('services', 'bookings.service_id', '=', 'services.id')
                ->where('bookings.tenant_id', $tenant->id)
                ->select('services.name', DB::raw('count(*) as total'))
                ->groupBy('services.name')
                ->orderBy('total', 'desc')
                ->first();

            // 3. تحليل الأيام الهادئة (Low-Traffic Days)
            $dayStats = $tenant->bookings()
                ->select(DB::raw('DAYNAME(appointment_at) as day'), DB::raw('count(*) as count'))
                ->groupBy('day')
                ->orderBy('count', 'asc')
                ->first();

            // 4. قائمة الخدمات الحالية
            $services = \App\Models\Service::where(function($q) use ($tenant) {
                $q->where('tenant_id', $tenant->id)
                  ->orWhere(function($sq) {
                      $sq->whereNull('tenant_id')->where('target_audience', 'salon');
                  });
            })->get(['name', 'price']);

            $servicesList = $services->map(fn($s) => "- {$s->name} (السعر: {$s->price} ج.م)")->implode("\n");

            $topServiceName = $topService ? $topService->name : 'غير متوفرة';
            $topServiceTotal = $topService ? $topService->total : 0;
            $quietDay = $dayStats ? $dayStats->day : 'غير محدد';

            return [
                'text' => "
--- إحصائيات الأداء الرقمي ---
- إجمالي الحجوزات (الكل): {$totalBookings}
- حجوزات هذا الشهر: {$monthBookings}
- إجمالي الإيرادات المحققة: {$revenue} ج.م

--- تحليل العملاء والخدمات ---
- الخدمة الأكثر طلباً: {$topServiceName} (تم حجزها {$topServiceTotal} مرة)
- اليوم الأقل ازدحاماً: {$quietDay} (فرصة لعمل عروض تنشيطية)

--- قائمة الخدمات المتاحة ---
{$servicesList}
",
                'quiet_day' => $quietDay,
                'top_service' => $topServiceName
            ];
        }
        
        return [
            'text' => "- بيانات العمل: يتم تحليل النشاط بناءً على التفاعلات الأخيرة على المنصة.",
            'quiet_day' => 'غير محدد',
            'top_service' => 'غير محدد'
        ];
    }

    private function getGlobalKnowledge()
    {
        $path = storage_path('app/knowledge/platform_knowledge.md');
        return file_exists($path) ? file_get_contents($path) : "مبادئ الإدارة والتسويق الأساسية.";
    }

    private function getEgyptianMarketContext()
    {
        return "- نحن الآن في فترة " . (now()->month >= 6 && now()->month <= 9 ? "موسم المناسبات" : "الفترة العادية") . ".\n- السوق المصري يميل حالياً للبحث عن توفير النفقات والقيمة المضافة.";
    }
}

