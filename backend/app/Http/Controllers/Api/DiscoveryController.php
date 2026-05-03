<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DiscoveryController extends Controller
{
    /**
     * البحث الذكي عن الصالونات والعروض القريبة
     */
    public function search(Request $request)
    {
        $lat = $request->query('lat');
        $lng = $request->query('lng');
        $governorate = $request->query('governorate');
        $serviceType = $request->query('service_type');

        $query = Tenant::query();

        // 1. الفلترة حسب المحافظة (إذا وجدت)
        if ($governorate) {
            $query->where('address', 'like', "%$governorate%");
        }

        // 2. الفلترة حسب نوع الخدمة (ربط مع جدول الخدمات)
        if ($serviceType) {
            $query->whereHas('services', function ($q) use ($serviceType) {
                $q->where('name', 'like', "%$serviceType%");
            });
        }

        // 3. حساب المسافة الجغرافية (إذا توفرت الإحداثيات)
        if ($lat && $lng) {
            $query->select('*')
                ->selectRaw(
                    "( 6371 * acos( cos( radians(?) ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians(?) ) + sin( radians(?) ) * sin( radians( latitude ) ) ) ) AS distance",
                    [$lat, $lng, $lat]
                )
                ->whereNotNull('latitude')
                ->whereNotNull('longitude')
                ->orderBy('distance');
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $salons = $query->with(['services' => function($q) {
            $q->limit(5); // عرض عينة من الخدمات
        }])->paginate(12);

        // إضافة معلومات "العروض" الذكية
        $salons->getCollection()->transform(function ($salon) {
            $salon->has_offers = $salon->services->count() > 0; // تبسيط حالياً
            $salon->distance_text = isset($salon->distance) ? round($salon->distance, 1) . " كم" : "غير محدد";
            return $salon;
        });

        return response()->json($salons);
    }
}
