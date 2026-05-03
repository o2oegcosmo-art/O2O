<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class TenantController extends Controller
{
    /**
     * Update the current tenant's profile and settings.
     */
    public function update(Request $request)
    {
        $tenant = $request->user()->tenant;

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'settings' => 'nullable|array',
            'google_ai_api_key' => 'nullable|string',
            'whatsapp_access_token' => 'nullable|string',
            'whatsapp_phone_number_id' => 'nullable|string',
            'onboarding_completed' => 'nullable|boolean',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        $tenant->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Salon settings updated successfully',
            'data' => $tenant
        ]);
    }
}

