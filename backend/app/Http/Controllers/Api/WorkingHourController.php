<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WorkingHour;
use Illuminate\Http\Request;

class WorkingHourController extends Controller
{
    /**
     * Display a listing of working hours.
     */
    public function index(Request $request)
    {
        $tenantId = $request->user()->tenant_id;
        $staffId = $request->query('staff_id');

        $query = WorkingHour::where('tenant_id', $tenantId);

        if ($staffId) {
            $query->where('staff_id', $staffId);
        } else {
            $query->whereNull('staff_id');
        }

        $hours = $query->orderBy('day_of_week')->get();

        return response()->json([
            'success' => true,
            'data' => $hours
        ]);
    }

    /**
     * Update or create working hours for a tenant/staff.
     */
    public function update(Request $request)
    {
        $tenantId = $request->user()->tenant_id;
        
        $request->validate([
            'hours' => 'required|array',
            'hours.*.day_of_week' => 'required|integer|between:0,6',
            'hours.*.start_time' => 'required|date_format:H:i:s',
            'hours.*.end_time' => 'required|date_format:H:i:s|after:hours.*.start_time',
            'hours.*.is_closed' => 'required|boolean',
            'staff_id' => 'nullable|exists:staff,id'
        ]);

        $staffId = $request->staff_id;

        foreach ($request->hours as $hourData) {
            WorkingHour::updateOrCreate(
                [
                    'tenant_id' => $tenantId,
                    'staff_id' => $staffId,
                    'day_of_week' => $hourData['day_of_week']
                ],
                [
                    'start_time' => $hourData['start_time'],
                    'end_time' => $hourData['end_time'],
                    'is_closed' => $hourData['is_closed']
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Working hours updated successfully'
        ]);
    }
}

