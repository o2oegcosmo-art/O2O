<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventAnalytic;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class EventController extends Controller
{
    /**
     * جلب كافة الفعاليات للصفحة العامة (فاعليات وتدريب)
     */
    public function index()
    {
        return Event::where('status', 'active')
            ->where('ends_at', '>', now())
            ->with('tenant:id,name,logo_url')
            ->orderBy('is_promoted', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate(12);
    }

    /**
     * محرك اختيار الإعلان المناسب (Ad Rotation Logic)
     */
    public function getPromotedAd(Request $request)
    {
        $userTenant = $request->user()->tenant;
        $userRole = $userTenant->target_audience ?? 'salon';
        $businessType = $userTenant->business_type ?? 'general';

        // 1. جلب الإعلانات النشطة والمستهدفة مع استخدام الكاش (MVP: File, Pro: Redis)
        $ads = Cache::remember("active_ads_{$userRole}", 300, function () use ($userRole) {
            return Event::where('is_promoted', true)
                ->where('status', 'active')
                ->where('ends_at', '>', now())
                ->where(function ($q) use ($userRole) {
                    $q->whereJsonContains('target_roles', $userRole)->orWhereNull('target_roles');
                })->get();
        });

        if ($ads->isEmpty()) return response()->json(null);

        // 2. المنطق السياقي (Contextual Optimization): زيادة وزن الإعلانات المتوافقة مع نوع النشاط
        $weightedAds = $ads->map(function ($ad) use ($businessType) {
            $weight = $ad->priority_weight;
            if ($ad->target_business_type === $businessType) {
                $weight *= 2; // مضاعفة فرصة الظهور إذا كان الإعلان يستهدف نشاط المستخدم بدقة
            }
            return ['ad' => $ad, 'weight' => $weight];
        });

        $totalWeight = $weightedAds->sum('weight');
        $randomSeed = rand(1, $totalWeight);
        $currentWeight = 0;
        $selectedAd = $ads->first();

        foreach ($weightedAds as $item) {
            $currentWeight += $item['weight'];
            if ($randomSeed <= $currentWeight) {
                $selectedAd = $item['ad'];
                break;
            }
        }

        // 3. تسجيل الظهور (ROI Tracking)
        EventAnalytic::create([
            'event_id' => $selectedAd->id,
            'tenant_id' => $userTenant->id,
            'type' => 'impression',
            'platform' => 'dashboard'
        ]);

        return response()->json($selectedAd);
    }

    /**
     * تسجيل نقرة على الإعلان (Click Tracking)
     */
    public function trackClick(Request $request, $eventId)
    {
        EventAnalytic::create([
            'event_id' => $eventId,
            'tenant_id' => $request->user()->tenant_id,
            'type' => 'click'
        ]);

        return response()->json(['success' => true]);
    }

    /**
     * إنشاء فعالية جديدة من لوحة التحكم
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'image_url' => 'required|url',
            'type' => 'required|in:training,event,masterclass',
            'starts_at' => 'required|date',
            'ends_at' => 'required|date|after:starts_at',
        ]);

        $data['tenant_id'] = $request->user()->tenant_id;
        $data['status'] = 'pending'; // الوضع الافتراضي للقرار الإداري
        $event = Event::create($data);

        return response()->json(['success' => true, 'data' => $event]);
    }

    /**
     * جلب فعاليات الشركة الخاصة بها فقط مع الإحصائيات المختصرة
     */
    public function myEvents(Request $request)
    {
        $tenantId = $request->user()->tenant_id;
        
        return Event::where('tenant_id', $tenantId)
            ->withCount([
                'analytics as impressions_count' => function($query) {
                    $query->where('type', 'impression');
                },
                'analytics as clicks_count' => function($query) {
                    $query->where('type', 'click');
                }
            ])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * جلب إحصائيات الأداء الكلية للشركة
     */
    public function getStats(Request $request)
    {
        $tenantId = $request->user()->tenant_id;

        $stats = EventAnalytic::whereHas('event', function($q) use ($tenantId) {
                $q->where('tenant_id', $tenantId);
            })
            ->selectRaw('type, count(*) as total')
            ->groupBy('type')
            ->pluck('total', 'type');

        return response()->json([
            'impressions' => $stats['impression'] ?? 0,
            'clicks' => $stats['click'] ?? 0,
            'active_events' => Event::where('tenant_id', $tenantId)->where('ends_at', '>', now())->count(),
            'total_events' => Event::where('tenant_id', $tenantId)->count(),
        ]);
    }
}
