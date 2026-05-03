<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Staff;
use Illuminate\Http\Request;

class StaffController extends Controller
{
    /**
     * Display a listing of the staff for the current tenant.
     */
    public function index(Request $request)
    {
        $staff = $request->user()->tenant->staff()->latest()->get();

        return response()->json([
            'success' => true,
            'data' => $staff
        ]);
    }

    /**
     * Store a newly created staff in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'specialization' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'is_active' => 'boolean',
        ]);

        $staff = $request->user()->tenant->staff()->create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Staff member added successfully',
            'data' => $staff
        ], 201);
    }

    /**
     * Update the specified staff in storage.
     */
    public function update(Request $request, Staff $staff)
    {
        // Ensure the staff belongs to the tenant
        if ($staff->tenant_id !== $request->user()->tenant_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'specialization' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'is_active' => 'boolean',
        ]);

        $staff->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Staff member updated successfully',
            'data' => $staff->fresh()
        ]);
    }

    /**
     * Update the status of the specified staff.
     */
    public function updateStatus(Request $request, Staff $staff)
    {
        if ($staff->tenant_id !== $request->user()->tenant_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate(['is_active' => 'required|boolean']);

        $staff->update(['is_active' => $request->is_active]);

        return response()->json([
            'success' => true,
            'message' => 'Staff status updated successfully'
        ]);
    }

    /**
     * Remove the specified staff from storage.
     */
    public function destroy(Request $request, Staff $staff)
    {
        if ($staff->tenant_id !== $request->user()->tenant_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $staff->delete();

        return response()->json([
            'success' => true,
            'message' => 'Staff member deleted successfully'
        ]);
    }
}
