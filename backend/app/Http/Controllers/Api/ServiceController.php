<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ServiceController extends Controller
{
    public function index(Request $request)
    {
        $query = Service::with('features')->latest();
        
        if ($request->user()) {
            $user = $request->user();
            $tenantId = $user->tenant_id;
            $role = $user->role; // admin, owner, staff

            if ($role === 'admin') {
                // الأدمن الرئيسي يرى كل شيء
                // No extra filtering
            } else {
                // صاحب الصالون يرى فقط خدماته الخاصة
                // لا يرى خدمات المنصة العالمية هنا لأنها تدار من مكان آخر (الاشتراكات/الإضافات)
                $query->where('tenant_id', $tenantId);
            }
        }

        return response()->json([
            'success' => true,
            'data' => $query->get()
        ]);
    }

    public function store(Request $request)
    {
        $tenantId = $request->user()->tenant_id;
        $category = $request->user()->tenant->business_category ?? 'salon';

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:active,beta,disabled',
            'target_audience' => 'nullable|in:salon,company,affiliate',
            'pricing_type' => 'nullable|in:subscription,addon,free',
            'price' => 'nullable|numeric|min:0',
            'image' => 'nullable|image|max:2048',
            'image_url' => 'nullable|string',
            'gallery' => 'nullable|array',
            'gallery.*' => 'nullable|string',
            'features' => 'nullable|array',
            'features.*.name' => 'required|string|max:255',
            'features.*.feature_key' => 'required|string|max:255|unique:service_features,feature_key',
            'features.*.enabled' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $serviceData = array_merge([
            'tenant_id' => $tenantId,
            'status' => 'active',
            'target_audience' => $category,
            'pricing_type' => 'free',
            'price' => 0.00
        ], $request->only([
            'name', 'description', 'status', 'target_audience', 'pricing_type', 'price', 'gallery'
        ]));

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('services', 'public');
            $serviceData['image_url'] = rtrim(config('app.url'), '/') . '/storage/' . $path;
        } elseif ($request->has('image_url')) {
            $serviceData['image_url'] = $request->image_url;
        }

        $service = Service::create($serviceData);

        if ($request->has('features')) {
            foreach ($request->features as $featureData) {
                $service->features()->create($featureData);
            }
        }

        $service->load('features');

        return response()->json([
            'success' => true,
            'message' => 'Service created successfully!',
            'data' => $service
        ], 201);
    }

    public function show(Service $service)
    {
        $service->load('features');
        return response()->json([
            'success' => true,
            'data' => $service
        ]);
    }

    public function update(Request $request, Service $service)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'sometimes|required|in:active,beta,disabled',
            'target_audience' => 'sometimes|required|in:salon,company,affiliate',
            'pricing_type' => 'sometimes|required|in:subscription,addon,free',
            'price' => 'sometimes|required|numeric|min:0',
            'image' => 'nullable|image|max:2048',
            'image_url' => 'nullable|string',
            'gallery' => 'nullable|array',
            'gallery.*' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // حماية خدمات المنصة: لا يمكن لغير الأدمن تعديل خدمة عالمية
        if (is_null($service->tenant_id) && $request->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'غير مسموح بتعديل خدمات المنصة الأساسية.'
            ], 403);
        }

        $updateData = $request->only([
            'name', 'description', 'status', 'target_audience', 'pricing_type', 'price', 'gallery'
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('services', 'public');
            $updateData['image_url'] = rtrim(config('app.url'), '/') . '/storage/' . $path;
        } elseif ($request->has('image_url')) {
            $updateData['image_url'] = $request->image_url;
        }

        $service->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Service updated successfully!',
            'data' => $service->load('features')
        ]);
    }

    public function destroy(Request $request, Service $service)
    {
        // حماية خدمات المنصة: لا يمكن لغير الأدمن حذف خدمة عالمية
        if (is_null($service->tenant_id) && $request->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'غير مسموح بحذف خدمات المنصة الأساسية. هذا قد يعطل النظام!'
            ], 403);
        }

        $service->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف الخدمة بنجاح!'
        ]);
    }
}
