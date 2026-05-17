<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Event;
use App\Models\Tenant;
use Illuminate\Support\Str;
use Carbon\Carbon;

class EventSeeder extends Seeder
{
    public function run(): void
    {
        // Get the first tenant or create one if it doesn't exist
        $tenant = Tenant::first();
        
        if (!$tenant) {
            $tenant = Tenant::create([
                'id' => Str::uuid(),
                'name' => 'L\'Oreal Professionnel Egypt',
                'domain' => 'loreal.o2oeg.local',
                'business_type' => 'company',
            ]);
        }

        $events = [
            [
                'id' => Str::uuid(),
                'tenant_id' => $tenant->id,
                'title' => 'ماستر كلاس: أحدث تقنيات صبغات الشعر 2026',
                'description' => 'انضم إلينا في هذا الماستر كلاس الحصري برعاية لوريال باريس للتعرف على أحدث صيحات وتقنيات صبغات الشعر، وكيفية التعامل مع الشعر المجهد بعد سحب اللون. التدريب عملي ونظري.',
                'image_url' => 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1000',
                'type' => 'masterclass',
                'is_promoted' => true,
                'priority_weight' => 5,
                'target_roles' => json_encode(['salon']),
                'target_business_type' => 'women_salon',
                'starts_at' => Carbon::now()->addDays(5)->toDateTimeString(),
                'ends_at' => Carbon::now()->addDays(6)->toDateTimeString(),
            ],
            [
                'id' => Str::uuid(),
                'tenant_id' => $tenant->id,
                'title' => 'دورة إدارة صالونات التجميل الحديثة (O2OEG)',
                'description' => 'كيف تدير صالونك باحترافية وتزيد من مبيعاتك باستخدام أنظمة الذكاء الاصطناعي؟ دورة تدريبية مكثفة لأصحاب الصالونات للتحول الرقمي الكامل.',
                'image_url' => 'https://images.unsplash.com/photo-1521590832167-7bfcfaa6362f?auto=format&fit=crop&q=80&w=1000',
                'type' => 'training',
                'is_promoted' => true,
                'priority_weight' => 3,
                'target_roles' => json_encode(['salon', 'marketer']),
                'target_business_type' => null,
                'starts_at' => Carbon::now()->addDays(10)->toDateTimeString(),
                'ends_at' => Carbon::now()->addDays(12)->toDateTimeString(),
            ],
            [
                'id' => Str::uuid(),
                'tenant_id' => $tenant->id,
                'title' => 'مؤتمر مستقبل العناية بالبشرة والتجميل',
                'description' => 'أكبر تجمع لأطباء الجلدية وخبراء العناية بالبشرة في مصر. اكتشف أحدث الأجهزة والمنتجات الطبية التجميلية في السوق المصري لعام 2026.',
                'image_url' => 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=1000',
                'type' => 'event',
                'is_promoted' => false,
                'priority_weight' => 1,
                'target_roles' => json_encode(['salon']),
                'target_business_type' => 'clinic',
                'starts_at' => Carbon::now()->addDays(20)->toDateTimeString(),
                'ends_at' => Carbon::now()->addDays(22)->toDateTimeString(),
            ]
        ];

        foreach ($events as $event) {
            Event::create($event);
        }
    }
}
