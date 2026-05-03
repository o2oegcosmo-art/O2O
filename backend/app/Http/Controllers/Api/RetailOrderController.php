<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RetailOrder;
use Illuminate\Http\Request;

class RetailOrderController extends Controller
{
    /**
     * جلب كل طلبات المتجر الإلكتروني لهذا الصالون
     */
    public function index(Request $request)
    {
        $tenant = $request->user()->tenant;

        $orders = RetailOrder::where('tenant_id', $tenant->id)
            ->with('items')
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json(['success' => true, 'orders' => $orders]);
    }

    /**
     * تحديث حالة الطلب (مثل: تأكيد، شحن، تسليم، إلغاء)
     */
    public function updateStatus(Request $request, $id)
    {
        $tenant = $request->user()->tenant;

        $order = RetailOrder::where('tenant_id', $tenant->id)->findOrFail($id);

        $data = $request->validate([
            'status' => 'required|in:pending,confirmed,shipped,delivered,cancelled'
        ]);

        $order->update(['status' => $data['status']]);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث حالة الطلب بنجاح.',
            'order' => $order
        ]);
    }

    /**
     * إحصائيات سريعة للطلبات
     */
    public function stats(Request $request)
    {
        $tenant = $request->user()->tenant;

        $stats = [
            'total'     => RetailOrder::where('tenant_id', $tenant->id)->count(),
            'pending'   => RetailOrder::where('tenant_id', $tenant->id)->where('status', 'pending')->count(),
            'confirmed' => RetailOrder::where('tenant_id', $tenant->id)->where('status', 'confirmed')->count(),
            'shipped'   => RetailOrder::where('tenant_id', $tenant->id)->where('status', 'shipped')->count(),
            'delivered' => RetailOrder::where('tenant_id', $tenant->id)->where('status', 'delivered')->count(),
            'revenue'   => RetailOrder::where('tenant_id', $tenant->id)->where('status', 'delivered')->sum('total_amount'),
        ];

        return response()->json(['success' => true, 'stats' => $stats]);
    }
}
