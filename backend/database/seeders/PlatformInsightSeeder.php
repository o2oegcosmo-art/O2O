<?php

namespace Database\Seeders;

use App\Models\PlatformInsight;
use Illuminate\Database\Seeder;

class PlatformInsightSeeder extends Seeder
{
    public function run(): void
    {
        // نماذج لدروس مستفادة من المنصة بشكل عام (Anonymized Trends)
        PlatformInsight::create([
            'type' => 'success_pattern',
            'category' => 'sales',
            'insight_text' => 'الحملات الترويجية التي تستهدف العملاء الذين لم يزوروا الصالون منذ 45 يوماً تحقق معدل عودة (Retention) بنسبة 22% عند استخدام خصم 15% على الخدمات العلاجية.',
            'significance_score' => 4.5
        ]);

        PlatformInsight::create([
            'type' => 'trend',
            'category' => 'booking',
            'insight_text' => 'هناك زيادة بنسبة 35% في طلب خدمات "بروتين الشعر" و "الترميم" خلال عطلات نهاية الأسبوع في المحافظات الساحلية مقارنة بالقاهرة.',
            'significance_score' => 3.8
        ]);

        PlatformInsight::create([
            'type' => 'warning',
            'category' => 'loyalty',
            'insight_text' => 'العملاء الذين ينتظرون أكثر من 20 دقيقة عن موعد حجزهم الأصلي لديهم احتمال 60% لعدم العودة مرة أخرى للصالون.',
            'significance_score' => 4.9
        ]);
    }
}
