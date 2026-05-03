<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Customer;

class CustomerController extends Controller
{
    /**
     * عرض قائمة العملاء الخاصين بالصالون مع عدد حجوزاتهم
     */
    public function index(Request $request)
    {
        $tenant = $request->user()->tenant;

        $customers = Customer::where('tenant_id', $tenant->id)
            ->withCount('bookings')
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $customers
        ]);
    }

    /**
     * إضافة عميل جديد يدوياً
     */
    public function store(Request $request)
    {
        $tenant = $request->user()->tenant;

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'category' => 'nullable|string|max:50',
        ]);

        $existing = Customer::where('tenant_id', $tenant->id)
            ->where('phone', $data['phone'])
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'هذا العميل مسجل بالفعل في صالونك'
            ], 422);
        }

        $customer = Customer::create([
            'tenant_id' => $tenant->id,
            'name' => $data['name'],
            'phone' => $data['phone'],
            'category' => $data['category'] ?? 'جديد',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم إضافة العميل بنجاح',
            'data' => $customer
        ]);
    }

    /**
     * تعديل بيانات عميل
     */
    public function update(Request $request, $id)
    {
        $tenant = $request->user()->tenant;
        $customer = Customer::where('tenant_id', $tenant->id)->findOrFail($id);

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'category' => 'nullable|string|max:50',
        ]);

        $customer->update($data);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث بيانات العميل بنجاح',
            'data' => $customer
        ]);
    }

    /**
     * حذف عميل
     */
    public function destroy(Request $request, $id)
    {
        $tenant = $request->user()->tenant;
        $customer = Customer::where('tenant_id', $tenant->id)->findOrFail($id);

        $customer->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف العميل بنجاح'
        ]);
    }
}
