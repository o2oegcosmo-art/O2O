<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CrmStylist;
use App\Models\CrmStylistCertification;
use App\Models\CrmOrder;
use App\Models\CrmClient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EducationROIController extends Controller
{
    /**
     * قائمة المصففين والشهادات لصالون معين
     */
    public function index(Request $request)
    {
        $clientId = $request->query('crm_client_id');
        return CrmStylist::where('crm_client_id', $clientId)
            ->with('certifications.event:id,title')
            ->get();
    }

    /**
     * تقرير أثر التدريب على المبيعات (ROI)
     */
    public function roiReport(Request $request)
    {
        $tenantId = $request->user()->tenant_id;

        // صالونات لديها مصففون معتمدون
        $certifiedSalonIds = CrmStylistCertification::join('crm_stylists', 'crm_stylist_certifications.crm_stylist_id', '=', 'crm_stylists.id')
            ->where('crm_stylists.tenant_id', $tenantId)
            ->distinct()
            ->pluck('crm_stylists.crm_client_id');

        $certifiedAvgSales = CrmOrder::whereIn('crm_client_id', $certifiedSalonIds)->avg('total_amount') ?: 0;
        $nonCertifiedAvgSales = CrmOrder::whereNotIn('crm_client_id', $certifiedSalonIds)
            ->where('tenant_id', $tenantId)
            ->avg('total_amount') ?: 0;

        return response()->json([
            'success' => true,
            'report' => [
                'certified_avg_sales' => round($certifiedAvgSales, 2),
                'non_certified_avg_sales' => round($nonCertifiedAvgSales, 2),
                'uplift_percentage' => $nonCertifiedAvgSales > 0 ? round((($certifiedAvgSales - $nonCertifiedAvgSales) / $nonCertifiedAvgSales) * 100, 2) : 0,
                'total_certified_stylists' => CrmStylist::where('tenant_id', $tenantId)->has('certifications')->count(),
            ]
        ]);
    }

    /**
     * منح شهادة لمصفف
     */
    public function certify(Request $request)
    {
        $data = $request->validate([
            'crm_stylist_id' => 'required|exists:crm_stylists,id',
            'event_id' => 'required|exists:events,id',
            'certified_at' => 'required|date'
        ]);

        $cert = CrmStylistCertification::updateOrCreate(
            ['crm_stylist_id' => $data['crm_stylist_id'], 'event_id' => $data['event_id']],
            ['certified_at' => $data['certified_at']]
        );

        return response()->json(['success' => true, 'certification' => $cert]);
    }
}

