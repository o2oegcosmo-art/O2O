<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Staff;
use App\Models\CrmVisit;
use App\Models\CrmOpportunity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SalesTeamController extends Controller
{
    /**
     * قائمة المندوبين وأدائهم
     */
    public function index(Request $request)
    {
        $tenantId = $request->user()->tenant_id;

        return Staff::where('tenant_id', $tenantId)
            ->where('specialization', 'Sales Rep')
            ->withCount('crmVisits')
            ->get()
            ->map(function($rep) {
                $rep->visits_count = $rep->crm_visits_count;
                $rep->closed_deals = $rep->opportunities()->where('stage', 'won')->count();
                $rep->revenue_generated = $rep->opportunities()->where('stage', 'won')->sum('estimated_value');
                return $rep;
            });
    }

    /**
     * سجل الزيارات الأخير
     */
    public function visits(Request $request)
    {
        return CrmVisit::where('tenant_id', $request->user()->tenant_id)
            ->with(['staff:id,name', 'client:id,salon_name,city'])
            ->orderBy('visited_at', 'desc')
            ->paginate(20);
    }

    /**
     * تسجيل زيارة جديدة (Check-in) مع التحقق من الموقع الجغرافي (Geofencing)
     */
    public function storeVisit(Request $request)
    {
        $data = $request->validate([
            'staff_id' => 'required|exists:staff,id',
            'crm_client_id' => 'required|exists:crm_clients,id',
            'notes' => 'nullable|string',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'outcome' => 'required|string',
        ]);

        $client = \App\Models\CrmClient::findOrFail($data['crm_client_id']);

        // 🛡️ التحقق من المسافة (Geofencing) لمنع الاحتيال
        if ($client->latitude && $client->longitude) {
            $distance = $this->calculateDistance(
                $data['latitude'], $data['longitude'],
                $client->latitude, $client->longitude
            );

            // السماح بهامش خطأ 200 متر فقط
            if ($distance > 0.2) { // 0.2 km = 200 meters
                return response()->json([
                    'success' => false,
                    'message' => 'عذراً، يجب أن تكون في موقع الصالون لتسجيل الزيارة. أنت تبعد ' . round($distance * 1000) . ' متر.'
                ], 403);
            }
        }

        $data['tenant_id'] = $request->user()->tenant_id;
        $data['visited_at'] = now();

        $visit = CrmVisit::create($data);

        // تحديث تاريخ آخر زيارة للعميل
        $client->update(['last_visit_at' => $data['visited_at']]);

        return response()->json(['success' => true, 'visit' => $visit]);
    }

    /**
     * حساب المسافة بين نقطتين بالكيلومترات (Haversine formula)
     */
    private function calculateDistance($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371;

        $latDelta = deg2rad($lat2 - $lat1);
        $lonDelta = deg2rad($lon2 - $lon1);

        $a = sin($latDelta / 2) * sin($latDelta / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($lonDelta / 2) * sin($lonDelta / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}

