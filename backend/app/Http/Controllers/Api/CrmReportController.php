<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CrmClient;
use App\Models\CrmOpportunity;
use App\Models\CrmCampaign;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CrmReportController extends Controller
{
    /**
     * تقرير المبيعات والنمو الشامل للشركة
     */
    public function getFullReport(Request $request)
    {
        $tenantId = $request->user()->tenant_id;

        // 1. المبيعات الشهرية (Won Opportunities)
        $monthlySales = CrmOpportunity::where('crm_opportunities.tenant_id', $tenantId)
            ->where('crm_opportunities.stage', 'won')
            ->selectRaw('MONTH(crm_opportunities.created_at) as month, SUM(crm_opportunities.estimated_value) as total')
            ->groupBy('month')
            ->get();

        // 2. توزيع العملاء حسب الفئة (VIP, Regular, Lead)
        $clientTiers = CrmClient::where('tenant_id', $tenantId)
            ->selectRaw('tier, count(*) as count')
            ->groupBy('tier')
            ->get();

        // 3. المبيعات حسب المدينة
        $salesByCity = CrmClient::where('crm_clients.tenant_id', $tenantId)
            ->join('crm_opportunities', 'crm_clients.id', '=', 'crm_opportunities.crm_client_id')
            ->where('crm_opportunities.stage', 'won')
            ->selectRaw('crm_clients.city, SUM(crm_opportunities.estimated_value) as total')
            ->groupBy('crm_clients.city')
            ->get();

        // 4. أداء الحملات (عدد الصفقات بعد كل حملة - تبسيط)
        $campaignCount = CrmCampaign::where('tenant_id', $tenantId)->count();
        $totalWonValue = CrmOpportunity::where('tenant_id', $tenantId)->where('stage', 'won')->sum('estimated_value');

        return response()->json([
            'sales_chart' => $monthlySales,
            'client_distribution' => $clientTiers,
            'geo_sales' => $salesByCity,
            'summary' => [
                'total_revenue' => $totalWonValue,
                'total_campaigns' => $campaignCount,
                'avg_deal_size' => CrmOpportunity::where('tenant_id', $tenantId)->where('stage', 'won')->avg('estimated_value') ?? 0,
                'conversion_rate' => $this->calculateConversionRate($tenantId)
            ]
        ]);
    }

    private function calculateConversionRate($tenantId)
    {
        $total = CrmOpportunity::where('tenant_id', $tenantId)->count();
        if ($total == 0) return 0;
        
        $won = CrmOpportunity::where('tenant_id', $tenantId)->where('stage', 'won')->count();
        return round(($won / $total) * 100, 1);
    }
}

