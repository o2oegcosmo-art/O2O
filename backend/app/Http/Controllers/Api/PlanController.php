<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use Illuminate\Http\Request;

class PlanController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => Plan::with('services')->get()
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'price' => 'required|numeric',
            'description' => 'nullable|string',
            'services' => 'array'
        ]);

        $plan = Plan::create($request->only(['name', 'price', 'description']));

        if ($request->has('services')) {
            $plan->services()->sync($request->services);
        }

        return response()->json([
            'success' => true,
            'data' => $plan->load('services')
        ]);
    }

    public function update(Request $request, $id)
    {
        $plan = Plan::findOrFail($id);
        
        $request->validate([
            'name' => 'string',
            'price' => 'numeric',
            'description' => 'nullable|string',
            'services' => 'array'
        ]);

        $plan->update($request->only(['name', 'price', 'description']));

        if ($request->has('services')) {
            $plan->services()->sync($request->services);
        }

        return response()->json([
            'success' => true,
            'data' => $plan->load('services')
        ]);
    }

    public function destroy($id)
    {
        $plan = Plan::findOrFail($id);
        $plan->delete();

        return response()->json(['success' => true]);
    }
}
