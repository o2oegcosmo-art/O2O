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
use App\Models\AffiliateProfile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

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
            'business_name' => 'required|string|max:255',
            'business_type' => 'required|string|max:100',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:50',
            'governorate' => 'required|string|max:100',
            'interest_type' => 'required|in:salon,company,affiliate',
            'social_link' => ['nullable', 'url', 'max:500', 'regex:/^(https?:\/\/)?(www\.)?(facebook\.com|instagram\.com|tiktok\.com|linkedin\.com)\/.+/i'],
            'message' => 'nullable|string',
            'ref_code' => 'nullable|string|exists:affiliate_profiles,promo_code',
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
            'data' => $lead,
            'lead' => $lead
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
        \Log::info("[LEAD_DEBUG] updateStatus called for lead: {$id} with status: " . $request->status);
        
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

            $frontendUrl = env('FRONTEND_URL', 'https://o2oeg.com');
            $businessType = ($lead->interest_type === 'salon' ? 'صالونك' : ($lead->interest_type === 'company' ? 'شركتك' : 'حسابك كمسوق'));
            
            $message = "مرحباً بك في O2OEG 🚀\n" .
                       "يسعدنا إبلاغك بقبول طلب انضمامك لمنصتنا!\n\n" .
                       "يرجى الدخول للرابط التالي لاستكمال بيانات {$businessType} والبدء فوراً:\n" .
                       "{$frontendUrl}/complete-profile?ref={$lead->id}";

            $whatsapp_sent = false;
            try {
                $bridgeUrl = 'http://localhost:9005/send';
                $client = new \GuzzleHttp\Client();
                \Log::info("[LEAD_DEBUG] Sending WhatsApp via Bridge: " . $bridgeUrl);
                $response = $client->post($bridgeUrl, [
                    'json' => [
                        'tenantId' => '00000000-0000-0000-0000-000000000000', // Super Admin Session ID
                        'to' => $phone, // Bridge handles @s.whatsapp.net
                        'text' => $message,
                    ],
                    'timeout' => 15
                ]);

                if ($response->getStatusCode() === 200) {
                    $whatsapp_sent = true;
                    \Log::info("[LEAD_DEBUG] WhatsApp sent successfully to: " . $phone);
                } else {
                    \Log::warning("[LEAD_DEBUG] Bridge returned non-200 status: " . $response->getStatusCode());
                }
            } catch (\Exception $e) {
                \Log::error("[LEAD_DEBUG] Failed to send WhatsApp message: " . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => $whatsapp_sent ? 'تم قبول الطلب وإرسال رسالة الواتساب بنجاح!' : 'تم قبول الطلب ولكن فشل إرسال الواتساب (تأكد من ربط واتساب الإدارة)',
                'whatsapp_sent' => $whatsapp_sent,
                'data' => $lead
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Lead status updated successfully!',
            'data' => $lead
        ]);
    }

    public function verifyForCompletion($id)
    {
        \Log::info("[LEAD_DEBUG] Verifying lead for completion: " . $id);
        $lead = Lead::find($id);

        if (!$lead) {
            \Log::warning("[LEAD_DEBUG] Lead not found: " . $id);
            return response()->json(['message' => 'رابط غير صالح - لم يتم العثور على الطلب'], 404);
        }

        if ($lead->status !== 'accepted') {
            \Log::warning("[LEAD_DEBUG] Lead status is not accepted: " . $lead->status . " for lead: " . $id);
            return response()->json(['message' => 'رابط غير صالح - الطلب لم يتم قبوله بعد'], 404);
        }

        \Log::info("[LEAD_DEBUG] Lead verified successfully: " . $id);

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
            'address' => 'nullable|string|max:500',
            'specialty' => 'nullable|string|max:100',
            'business_reg' => 'nullable|string|max:100',
            'payout_method' => 'nullable|string|max:100',
            'payout_details' => 'nullable|string|max:500',
            'logo_url' => 'nullable|string',
            'cover_url' => 'nullable|string',
            'owner_photo_url' => 'nullable|string',
            'theme' => 'nullable|string',
            'description' => 'nullable|string',
            'services' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        DB::beginTransaction();
        try {
            $tenantId = '00000000-0000-0000-0000-000000000000'; // Default system tenant for affiliates

            if ($lead->interest_type === 'salon' || $lead->interest_type === 'company') {
                // 🚀 AUTO-DOMAIN GENERATION: Create a clean link from business name
                $baseDomain = Str::slug($lead->business_name ?? $lead->name);
                if (empty($baseDomain)) {
                    $baseDomain = 'salon-' . Str::random(5);
                }
                
                // Ensure uniqueness
                $domain = $baseDomain;
                $counter = 1;
                while (Tenant::where('domain', $domain)->exists()) {
                    $domain = $baseDomain . $counter;
                    $counter++;
                }

                $tenant = Tenant::create([
                    'name' => $lead->business_name ?? $lead->name,
                    'domain' => $domain,
                    'business_category' => $lead->interest_type === 'company' ? 'company' : 'salon',
                    'status' => 'active',
                    'address' => $request->address,
                    'specialty' => $request->specialty,
                    'business_reg' => $request->business_reg,
                    'logo_url' => $request->logo_url,
                    'og_image_url' => $request->cover_url,
                    'description' => $request->description ?? "مرحباً بكم في " . ($lead->business_name ?? $lead->name) . " - نسعى لتقديم أفضل خدمات الجمال والعناية بأحدث المعايير.",
                    'settings' => [
                        'theme' => $request->theme ?? 'rose_gold',
                        'owner_photo_url' => $request->owner_photo_url
                    ],
                    'onboarding_completed' => true, // Mark as completed since they provided address/password
                ]);
                $tenantId = $tenant->id;

                // 🚀 AUTO-CREATE SELECTED SERVICES
                if ($request->has('services') && is_array($request->services)) {
                    foreach ($request->services as $srv) {
                        \App\Models\Service::create([
                            'tenant_id' => $tenantId,
                            'name' => $srv['name'],
                            'price' => $srv['price'] ?? 150,
                            'duration' => $srv['duration'] ?? 45,
                            'image_url' => $srv['image_url'] ?? null,
                            'status' => 'active',
                        ]);
                    }
                }

                // 🚀 NEW: Auto-assign FREE subscription (Fixed the "kick out" issue)
                $freePlan = \App\Models\Plan::where('slug', 'free')->first();
                if ($freePlan) {
                    \App\Models\Subscription::create([
                        'tenant_id' => $tenantId,
                        'plan_id' => $freePlan->id,
                        'status' => 'active',
                        'starts_at' => now(),
                        'ends_at' => now()->addYears(10),
                    ]);
                }

                // 🚀 NEW: Activate Core Services
                $coreServices = \App\Models\Service::whereIn('slug', [
                    'smart-booking-system',
                    'crm-system',
                    'public-page',
                    'e-commerce'
                ])->get();

                foreach ($coreServices as $service) {
                    $tenant->services()->attach($service->id, [
                        'status' => 'active',
                        'activated_at' => now(),
                    ]);
                }
            }

            // Create the base User
            $user = User::create([
                'tenant_id' => $tenantId,
                'name' => $lead->name,
                'email' => $lead->email ?? ($lead->phone . '@o2oeg.com'),
                'phone' => $lead->phone,
                'password' => Hash::make($request->password),
                'role' => $lead->interest_type === 'affiliate' ? 'affiliate' : 'owner',
                'business_category' => $lead->interest_type === 'company' ? 'company' : ($lead->interest_type === 'salon' ? 'salon' : null),
            ]);

            // Create Affiliate Profile if needed
            if ($lead->interest_type === 'affiliate') {
                AffiliateProfile::create([
                    'user_id' => $user->id,
                    'promo_code' => strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $lead->name), 0, 5) . rand(100, 999)),
                    'commission_percentage' => 10, // Default 10%
                    'status' => 'active',
                    'payout_method' => $request->payout_method,
                    'payout_details' => $request->payout_details
                ]);
            }

            // 3. Delete the lead to prevent duplicate conversion
            $lead->delete();

            DB::commit();

            // 🚀 Return token immediately to allow instant login after completion
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'message' => 'تم إنشاء الحساب وتفعيل الخدمات بنجاح!',
                'access_token' => $token,
                'token_type' => 'Bearer',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'role' => $user->role,
                    'business_category' => $user->business_category
                ]
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error("Lead conversion failed: " . $e->getMessage());
            return response()->json(['message' => 'حدث خطأ غير متوقع أثناء إعداد الحساب. يرجى المحاولة لاحقاً.'], 500);
        }
    }

    public function destroy($id)
    {
        \Log::info("[LEAD_DEBUG] destroy called for lead: {$id}");
        try {
            $lead = Lead::findOrFail($id);
            $lead->delete();

            return response()->json([
                'success' => true,
                'message' => 'تم حذف المهتم بنجاح!'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء محاولة الحذف.'
            ], 500);
        }
    }

    public function bridgeLogout()
    {
        try {
            $user = auth()->user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
            }

            $tenantId = $user->tenant_id;
            $client = new \GuzzleHttp\Client();
            $bridgeUrl = 'http://localhost:9005/logout/' . $tenantId;
            
            $response = $client->post($bridgeUrl, [
                'timeout' => 15
            ]);

            return response()->json([
                'success' => true,
                'message' => 'WhatsApp bridge disconnected successfully.'
            ]);
        } catch (\Exception $e) {
            \Log::error("[BRIDGE_DEBUG] Logout failed: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to disconnect: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * استقبال العملاء من Facebook Lead Ads عبر Make.com
     */
    public function storeFacebookLead(Request $request)
    {
        // 1. التحقق من التوكن السري للأمان
        $makeToken = env('MAKE_WEBHOOK_TOKEN', 'O2OEG_DEFAULT_SECRET_2026');
        if ($request->header('X-MAKE-TOKEN') !== $makeToken) {
            \Log::warning("[FB_LEAD] Unauthorized attempt to submit lead from IP: " . $request->ip());
            return response()->json(['success' => false, 'message' => 'Unauthorized access'], 401);
        }

        // 2. التحقق من البيانات (فيسبوك يرسل عادة الاسم والهاتف كحد أدنى)
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:50',
            'email' => 'nullable|email|max:255',
            'business_name' => 'nullable|string|max:255',
            'interest_type' => 'required|in:salon,company,affiliate',
            'message' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // 3. تخزين العميل في قاعدة البيانات
        $lead = Lead::create([
            'name' => $request->name,
            'phone' => $request->phone,
            'email' => $request->email ?? ($request->phone . '@facebook.leads'),
            'business_name' => $request->business_name ?? ($request->name . ' - FB'),
            'business_type' => $request->interest_type === 'salon' ? 'Salon' : 'Company',
            'interest_type' => $request->interest_type,
            'governorate' => $request->governorate ?? 'Facebook Ad',
            'social_link' => $request->social_link ?? 'https://facebook.com/leads',
            'status' => 'pending',
            'message' => $request->message ?? 'Submitted via Facebook Lead Ads',
        ]);

        \Log::info("[FB_LEAD] New lead captured from Facebook: " . $lead->name);

        return response()->json([
            'success' => true,
            'message' => 'Lead captured successfully from Facebook!',
            'lead_id' => $lead->id
        ], 201);
    }
}

