<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\InventoryItem;
use App\Models\ServiceMaterial;
use App\Models\Service;

class InventoryController extends Controller
{
    public function index(Request $request)
    {
        $items = InventoryItem::latest()->get();
        return response()->json([
            'success' => true,
            'data' => $items
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string',
            'unit' => 'required|string',
            'quantity_in_stock' => 'required|numeric|min:0',
            'cost_per_unit' => 'required|numeric|min:0',
            'price' => 'nullable|numeric|min:0',
            'is_retail' => 'nullable|boolean',
            'is_consumable' => 'nullable|boolean',
        ]);

        $item = InventoryItem::create($data);

        return response()->json([
            'success' => true,
            'message' => 'تم إضافة المادة إلى المستودع بنجاح',
            'data' => $item
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $item = InventoryItem::findOrFail($id);

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'quantity_in_stock' => 'required|numeric|min:0',
            'cost_per_unit' => 'required|numeric|min:0',
        ]);

        $item->update($data);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث البيانات بنجاح',
            'data' => $item
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $item = InventoryItem::findOrFail($id);
        $item->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم الحذف بنجاح'
        ]);
    }

    // ربط مادة بخدمة معينة
    public function linkMaterialToService(Request $request)
    {
        $request->validate([
            'service_id' => 'required|exists:services,id',
            'inventory_item_id' => 'required|exists:inventory_items,id',
            'quantity_used' => 'required|numeric|min:0.01'
        ]);

        $tenantId = $request->user()->tenant_id;
        $service = Service::where('tenant_id', $tenantId)->findOrFail($request->service_id);
        $inventoryItem = InventoryItem::where('tenant_id', $tenantId)->findOrFail($request->inventory_item_id);

        $material = ServiceMaterial::updateOrCreate(
            [
                'service_id' => $service->id,
                'inventory_item_id' => $inventoryItem->id,
                'tenant_id' => $tenantId
            ],
            [
                'quantity_used' => $request->quantity_used
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'تم ربط المادة بالخدمة بنجاح',
            'data' => $material
        ]);
    }
}
