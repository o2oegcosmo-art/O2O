<?php

namespace Database\Seeders;

use App\Models\KnowledgeBase;
use Illuminate\Database\Seeder;

class KnowledgeBaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. كتيبات منتجات لوريال (L'Oreal Product Manuals)
        KnowledgeBase::create([
            'title' => 'دليل صبغات L\'Oreal Majirel',
            'category' => 'products',
            'content' => "صبغة Majirel هي الصبغة الدائمة الأيقونية من لوريال. 
            المكونات النشطة: Ionène G و Incell. 
            تغطية الشعر الأبيض: تصل إلى 100%. 
            نسبة الخلط: 1:1.5 (مثلاً 50 مل صبغة مع 75 مل أكسيدان). 
            وقت المعالجة: 35 دقيقة. 
            نصيحة البيع: ابدأ دائماً بتشخيص فروة الرأس واستخدم شامبو Metal Detox قبل التلوين لضمان أفضل نتيجة.",
            'metadata' => ['brand' => 'L\'Oreal', 'line' => 'Majirel']
        ]);

        KnowledgeBase::create([
            'title' => 'بروتوكول العناية بالشعر تاليس (Tailor-made Protocol)',
            'category' => 'guidelines',
            'content' => "أدلة خدمة العملاء في صالونات O2OEG الفاخرة:
            1. الاستقبال: الترحيب بالعميل بالاسم خلال 10 ثوانٍ من الدخول.
            2. الاستشارة: استخدام تطبيق التشخيص الرقمي لتحديد نوع الشعر.
            3. التجربة الحسية: تقديم مشروب الضيافة وتدليك الرأس أثناء الغسيل.
            4. الإغلاق: اقتراح 3 منتجات للعناية المنزلية بناءً على التشخيص.",
            'metadata' => ['brand' => 'O2OEG', 'type' => 'customer_service']
        ]);

        KnowledgeBase::create([
            'title' => 'قوانين العمل داخل الصالون',
            'category' => 'legal',
            'content' => "قواعد الالتزام للموظفين:
            - ارتداء الزي الرسمي المعتمد والشارة التعريفية.
            - يمنع استخدام الهاتف المحمول أمام العملاء.
            - يجب تعقيم الأدوات (المقصات والأمشاط) بعد كل عميل باستخدام جهاز التعقيم بالأشعة.
            - الحضور قبل موعد الحجز الأول بـ 15 دقيقة على الأقل.",
            'metadata' => ['target' => 'staff']
        ]);
    }
}
