<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Validator;
use App\Models\Payment;
use App\Models\Subscription;
use App\Models\User;
use App\Models\Tenant;
use App\Models\AffiliateMarket;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

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

    public function verifyForCompletion($id)
    {
        $lead = Lead::find($id);

        if (!$lead || $lead->status !== 'accepted') {
            return response()->json(['message' => 'رابط غير صالح أو غير مصرح به'], 404);
        }

        // Return safe data to the frontend to pre-fill the form
        return response()->json([
            'id' => $lead->id,
            'name' => $lead->name,
            'phone' => $lead->phone,
            'interest_type' => $lead->interest_type,
        ]);
    }

    public function convertToUser(Request $request, $id)
    {
        $lead = Lead::findOrFail($id);

        if ($lead->status !== 'accepted') {
            return response()->json(['message' => 'الطلب لم يتم قبوله بعد'], 403);
        }

        $validator = Validator::make($request->all(), [
            'password' => 'required|string|min:6',
            'domain' => 'nullable|string|unique:tenants,domain',
            // Specific validations based on interest_type can be added here
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        DB::beginTransaction();
        try {
            // 1. Create the base User
            $user = User::create([
                'name' => $lead->name,
                'email' => $lead->phone . '@o2oeg.com', // Using phone as unique email identifier
                'phone' => $lead->phone,
                'password' => Hash::make($request->password),
                'role' => $lead->interest_type === 'affiliate' ? 'affiliate' : 'salon',
                'business_category' => $lead->interest_type === 'company' ? 'company' : ($lead->interest_type === 'salon' ? 'salon' : null),
            ]);

            // 2. Create the associated entity based on type
            if ($lead->interest_type === 'salon' || $lead->interest_type === 'company') {
                $tenant = Tenant::create([
                    'user_id' => $user->id,
                    'name' => $lead->name,
                    'domain' => $request->domain ?? uniqid('brand-'),
                    'business_category' => $lead->interest_type === 'company' ? 'company' : 'salon',
                    'status' => 'active', // Automatically active since they were accepted
                ]);
            } elseif ($lead->interest_type === 'affiliate') {
                AffiliateMarket::create([
                    'user_id' => $user->id,
                    'promo_code' => strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $lead->name), 0, 5) . rand(100, 999)),
                    'commission_percentage' => 10, // Default 10%
                    'status' => 'active'
                ]);
            }

            // 3. Delete the lead to prevent duplicate conversion
            $lead->delete();

            DB::commit();

            return response()->json(['message' => 'تم إنشاء الحساب بنجاح!'], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error("Lead conversion failed: " . $e->getMessage());
            return response()->json(['message' => 'حدث خطأ غير متوقع أثناء إعداد الحساب. يرجى المحاولة لاحقاً.'], 500);
        }
    }
}

