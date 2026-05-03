<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductCatalogController extends Controller
{
    /**
     * جلب كل المنتجات (مع فلترة حسب الحالة)
     */
    public function index(Request $request)
    {
        $query = Product::with(['tenant:id,name,domain'])
            ->latest();

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $products = $query->paginate(20);

        return response()->json($products);
    }

    /**
     * تغيير حالة المنتج (موافقة / رفض / تعليق)
     */
    public function updateStatus(Request $request, string $id)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected,pending',
            'rejection_reason' => 'nullable|string|max:500',
        ]);

        $product = Product::findOrFail($id);
        $product->update([
            'status' => $request->status,
            'rejection_reason' => $request->status === 'rejected' ? $request->rejection_reason : null,
            'reviewed_at' => now(),
        ]);

        $statusLabel = match($request->status) {
            'approved' => 'تمت الموافقة على المنتج',
            'rejected'  => 'تم رفض المنتج',
            default     => 'تم تعليق المنتج',
        };

        return response()->json(['message' => $statusLabel, 'product' => $product]);
    }

    /**
     * حذف منتج نهائياً
     */
    public function destroy(string $id)
    {
        $product = Product::findOrFail($id);
        $product->delete();

        return response()->json(['message' => 'تم حذف المنتج نهائياً']);
    }

    /**
     * إحصائيات سريعة للمخزن
     */
    public function stats()
    {
        return response()->json([
            'total'    => Product::count(),
            'pending'  => Product::where('status', 'pending')->count(),
            'approved' => Product::where('status', 'approved')->count(),
            'rejected' => Product::where('status', 'rejected')->count(),
        ]);
    }
}

