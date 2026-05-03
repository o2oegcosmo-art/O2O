<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Validator;
use App\Models\Payment;
use App\Models\Subscription;

class LeadController extends Controller
{
    public function index()
    {
        $leads = Lead::latest()->get();
        return response()->json($leads);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:50',
            'governorate' => 'required|string|max:100',
            'interest_type' => 'required|in:salon,company,affiliate',
            'message' => 'nullable|string',
            'ref_code' => 'nullable|string', // Removed 'exists' check temporarily to prevent 500 errors during deployment transition
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $lead = Lead::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Lead captured successfully!',
            'data' => $lead
        ], 201);
    }
    public function dashboardStats()
    {
        // 1. حساب إجمالي المهتمين من قاعدة البيانات
        $leadsCount = Lead::count();

        // 2. حساب نمو المهتمين (Growth) لآخر 7 أيام للرسم البياني
        $growthData = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $count = Lead::whereDate('created_at', $date)->count();
            
            // تحويل الرقم إلى قيمة تناسب الرسم البياني (CSS Height)
            // نضع حداً أدنى (15) لضمان ظهور شريط صغير حتى لو لم توجد بيانات
            $growthData[] = $count > 0 ? min($count * 30, 100) : 15;
        }

        // 3. البيانات المالية الحقيقية (Revenue Tracking)
        $totalRevenue = Payment::where('status', 'successful')->sum('amount') ?? 0;
        $activeSubscriptions = Subscription::where('status', 'active')->count();
        
        // حساب الـ MRR (الإيرادات الشهرية المتكررة) بشكل تقريبي بناءً على الاشتراكات النشطة
        $mrr = Subscription::where('status', 'active')
            ->join('plans', 'subscriptions.plan_id', '=', 'plans.id')
            ->sum('plans.price') ?? 0;

        return response()->json([
            'mrr' => (float) $mrr,
            'totalRevenue' => (float) $totalRevenue,
            'activeSubscriptions' => $activeSubscriptions,
            'leadsCount' => $leadsCount,
            'growthData' => $growthData
        ]);
    }
}

