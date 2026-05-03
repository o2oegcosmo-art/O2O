<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TenantServiceController extends Controller
{
    /**
     * عرض قائمة المشتركين والخدمات المفعّلة لكل منهم
     */
    public function index()
    {
        $tenants = Tenant::with('services')->get();
        return response()->json($tenants);
    }

    /**
     * جلب كافة الخدمات المتاحة في المنصة (السيادية)
     */
    public function allServices()
    {
        $services = Service::whereNull('tenant_id')->get();
        return response()->json($services);
    }

    /**
     * تفعيل أو تعطيل خدمة لمشترك معين
     */
    public function toggleService(Request $request)
    {
        $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
            'service_id' => 'required|exists:services,id',
            'action' => 'required|in:enable,disable'
        ]);

        $tenant = Tenant::findOrFail($request->tenant_id);
        
        if ($request->action === 'enable') {
            // تفعيل الخدمة (إضافة للسجل)
            $tenant->services()->syncWithoutDetaching([$request->service_id => [
                'status' => 'active',
                'activated_at' => now()
            ]]);
            $message = 'تم تفعيل الخدمة للمشترك بنجاح';
        } else {
            // تعطيل الخدمة
            $tenant->services()->detach($request->service_id);
            $message = 'تم تعطيل الخدمة للمشترك';
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $tenant->load('services')
        ]);
    }
}