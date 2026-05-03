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
            'social_link' => ['required', 'url', 'max:500', 'regex:/^(https?:\/\/)?(www\.)?(facebook\.com|instagram\.com|tiktok\.com|linkedin\.com)\/.+/i'],
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
    public function updateStatus(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:accepted,rejected',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $lead = Lead::findOrFail($id);
        $lead->status = $request->status;
        $lead->save();

        if ($lead->status === 'accepted') {
            // إرسال رسالة الواتساب التلقائية عبر جسر Node.js
            $phone = preg_replace('/[^0-9]/', '', $lead->phone);
            // تأكد من وجود كود البلد (مثال: 20 لمصر)
            if (strlen($phone) == 11 && str_starts_with($phone, '01')) {
                $phone = '2' . $phone;
            }

            $message = "مرحباً بك في O2OEG 🚀\nيسعدنا إبلاغك بقبول طلب انضمامك لمنصتنا!\n\nيرجى الدخول للرابط التالي لاستكمال بيانات " . ($lead->interest_type === 'salon' ? 'صالونك' : ($lead->interest_type === 'company' ? 'شركتك' : 'حسابك كمسوق')) . " والبدء فوراً:\nhttps://o2oeg.com/complete-profile?ref=" . $lead->id;

            try {
                $bridgeUrl = 'http://127.0.0.1:3000/send-message';
                $client = new \GuzzleHttp\Client();
                $client->post($bridgeUrl, [
                    'json' => [
                        'phone' => $phone . '@c.us',
                        'message' => $message,
                    ],
                    'headers' => [
                        'x-api-key' => env('BRIDGE_API_KEY', 'o2oeg_bridge_secret_2026_z8v9')
                    ],
                    'timeout' => 5
                ]);
            } catch (\Exception $e) {
                // Log error but don't fail the response
                \Log::error("Failed to send WhatsApp message to lead: " . $e->getMessage());
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Lead status updated successfully!',
            'data' => $lead
        ]);
    }
}

