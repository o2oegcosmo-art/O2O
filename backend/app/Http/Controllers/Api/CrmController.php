<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CrmClient;
use App\Models\CrmOpportunity;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CrmController extends Controller
{
    /**
     * جلب قائمة الصالونات (العملاء)
     */
    public function clientsIndex(Request $request)
    {
        return CrmClient::where('tenant_id', $request->user()->tenant_id)
            ->orderBy('tier', 'asc')
            ->orderBy('salon_name', 'asc')
            ->paginate(15);
    }

    /**
     * إضافة صالون جديد للـ CRM
     */
    public function clientsStore(Request $request)
    {
        $data = $request->validate([
            'salon_name' => 'required|string|max:255',
            'owner_name' => 'nullable|string|max:255',
            'phone' => 'required|string',
            'city' => 'required|string',
            'size' => 'required|in:small,medium,large',
            'tier' => 'required|in:vip,regular,lead',
        ]);

        $data['tenant_id'] = $request->user()->tenant_id;
        $client = CrmClient::create($data);

        return response()->json(['success' => true, 'data' => $client]);
    }

    /**
     * جلب خط أنابيب المبيعات (Sales Pipeline)
     */
    public function pipelineIndex(Request $request)
    {
        return CrmOpportunity::where('tenant_id', $request->user()->tenant_id)
            ->with('client:id,salon_name')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * تحديث مرحلة الفرصة البيعية
     */
    public function pipelineUpdate(Request $request, $id)
    {
        $opportunity = CrmOpportunity::where('tenant_id', $request->user()->tenant_id)->findOrFail($id);
        
        $data = $request->validate([
            'stage' => 'required|in:new_lead,contacted,proposal,negotiation,won,lost',
        ]);

        $opportunity->update($data);

        return response()->json(['success' => true]);
    }

    /**
     * إحصائيات الـ CRM الكلية
     */
    public function stats(Request $request)
    {
        $tenantId = $request->user()->tenant_id;

        return response()->json([
            'total_clients' => CrmClient::where('tenant_id', $tenantId)->count(),
            'active_opportunities' => CrmOpportunity::where('tenant_id', $tenantId)->whereNotIn('stage', ['won', 'lost'])->count(),
            'total_sales_value' => CrmOpportunity::where('tenant_id', $tenantId)->where('stage', 'won')->sum('estimated_value'),
            'pipeline_summary' => CrmOpportunity::where('tenant_id', $tenantId)
                ->selectRaw('stage, count(*) as count')
                ->groupBy('stage')
                ->pluck('count', 'stage'),
        ]);
    }
}
