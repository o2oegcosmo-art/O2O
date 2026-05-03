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
            $tenantId = $request->user()->tenant_id;
            $category = $request->user()->tenant->business_category ?? 'salon';
            
            $query->where(function($q) use ($tenantId, $category) {
                $q->where('tenant_id', $tenantId)
                  ->orWhere(function($sq) use ($category) {
                      $sq->whereNull('tenant_id')
                         ->where('target_audience', $category);
                  });
            });
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
            'name', 'description', 'status', 'target_audience', 'pricing_type', 'price'
        ]));

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
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $service->update($request->only([
            'name', 'description', 'status', 'target_audience', 'pricing_type', 'price'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Service updated successfully!',
            'data' => $service->load('features')
        ]);
    }

    public function destroy(Service $service)
    {
        $service->delete();

        return response()->json([
            'success' => true,
            'message' => 'Service deleted successfully!'
        ]);
    }
}
