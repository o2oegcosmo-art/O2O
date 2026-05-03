<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CrmOrder;
use App\Models\CrmOrderItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CrmOrderController extends Controller
{
    /**
     * قائمة الطلبات الواردة للشركة
     */
    public function index(Request $request)
    {
        return CrmOrder::where('tenant_id', $request->user()->tenant_id)
            ->with(['client:id,salon_name,city', 'items.product:id,name'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);
    }

    /**
     * كتالوج المنتجات المتاح للصالونات (من الشركات الموردة)
     */
    public function catalog(Request $request)
    {
        // إذا كان المستخدم صالون، يرى منتجات الشركات
        // إذا كان شركة، يرى منتجاته الخاصة لإدارتها
        $userTenant = $request->user()->tenant;
        
        if ($userTenant->business_category === 'company') {
            return Product::where('tenant_id', $userTenant->id)
                ->get();
        }

        return Product::whereHas('tenant', function($q) {
                $q->where('business_category', 'company');
            })
            ->with('tenant:id,name,logo_url')
            ->where('stock_quantity', '>', 0)
            ->get();
    }

    /**
     * إنشاء طلب جديد
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'crm_client_id' => 'required|string', // يمكن أن يكون ID أو 'auto-detect'
            'items' => 'required|array',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string'
        ]);

        return DB::transaction(function () use ($data, $request) {
            $buyerTenant = $request->user()->tenant;
            
            // تحديد المنتج الأول لمعرفة المورد (تبسيط: نفترض مورد واحد لكل طلب)
            $firstProduct = Product::findOrFail($data['items'][0]['product_id']);
            $supplierTenantId = $firstProduct->tenant_id;

            $crmClientId = $data['crm_client_id'];

            if ($crmClientId === 'auto-detect') {
                // البحث عن الصالون في قائمة عملاء المورد، أو إنشاؤه
                $client = \App\Models\CrmClient::firstOrCreate(
                    ['tenant_id' => $supplierTenantId, 'phone' => $buyerTenant->phone ?? $request->user()->phone],
                    [
                        'salon_name' => $buyerTenant->name,
                        'city' => $buyerTenant->address ?? 'غير محدد',
                        'tier' => 'regular'
                    ]
                );
                $crmClientId = $client->id;
            }

            $total = 0;
            $itemsToCreate = [];

            foreach ($data['items'] as $item) {
                $product = Product::findOrFail($item['product_id']);
                
                // التأكد أن جميع المنتجات لنفس المورد
                if ($product->tenant_id !== $supplierTenantId) continue;

                $linePrice = $product->wholesale_price * $item['quantity'];
                $total += $linePrice;

                $itemsToCreate[] = [
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                    'price_at_order' => $product->wholesale_price
                ];

                $product->decrement('stock_quantity', $item['quantity']);
            }

            $order = CrmOrder::create([
                'tenant_id' => $supplierTenantId,
                'crm_client_id' => $crmClientId,
                'total_amount' => $total,
                'status' => 'pending',
                'notes' => $data['notes']
            ]);

            foreach ($itemsToCreate as $itemData) {
                $itemData['crm_order_id'] = $order->id;
                CrmOrderItem::create($itemData);
            }

            return response()->json(['success' => true, 'order' => $order]);
        });
    }

    /**
     * تحديث حالة الطلب
     */
    public function updateStatus(Request $request, $id)
    {
        $order = CrmOrder::where('tenant_id', $request->user()->tenant_id)->findOrFail($id);
        $order->update(['status' => $request->status]);

        return response()->json(['success' => true, 'order' => $order]);
    }

    /**
     * إضافة منتج جديد للكتالوج (خاص بالشركات)
     */
    public function storeProduct(Request $request)
    {
        $userTenant = $request->user()->tenant;
        
        // التحقق من أن المستأجر هو شركة (Company)
        if ($userTenant->business_category !== 'company' && $userTenant->type !== 'company') {
            return response()->json([
                'message' => 'Unauthorized: Only companies can manage catalog.',
                'debug_info' => [
                    'tenant_type' => $userTenant->type,
                    'tenant_category' => $userTenant->business_category
                ]
            ], 403);
        }

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'wholesale_price' => 'required|numeric|min:0',
            'retail_price' => 'required|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'image_url' => 'nullable|string',
            'category' => 'nullable|string'
        ]);

        $product = Product::create(array_merge($data, [
            'tenant_id' => $userTenant->id,
            'is_active' => true
        ]));

        return response()->json(['success' => true, 'product' => $product], 201);
    }

    /**
     * تحديث منتج موجود
     */
    public function updateProduct(Request $request, $id)
    {
        $userTenant = $request->user()->tenant;
        $product = Product::where('tenant_id', $userTenant->id)->findOrFail($id);

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'wholesale_price' => 'sometimes|numeric|min:0',
            'retail_price' => 'sometimes|numeric|min:0',
            'stock_quantity' => 'sometimes|integer|min:0',
            'image_url' => 'nullable|string',
            'category' => 'nullable|string',
            'is_active' => 'sometimes|boolean'
        ]);

        $product->update($data);

        return response()->json(['success' => true, 'product' => $product]);
    }
}
