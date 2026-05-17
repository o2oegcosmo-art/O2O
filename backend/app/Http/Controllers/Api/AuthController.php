<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Models\Tenant;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Service;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Services\WhatsAppService;
use Carbon\Carbon;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'phone' => 'required|string',
            'password' => 'required',
            'remember' => 'nullable|boolean'
        ]);

        $user = User::where(function($query) use ($request) {
            $query->where('phone', $request->phone)
                  ->orWhere('email', $request->phone);
        })->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'phone' => ['بيانات الدخول غير صحيحة.'],
            ]);
        }

        // Revoke previous tokens if NOT remembering? Actually, usually we revoke all to enforce single session, 
        // but if remembering, we might want to keep it. For now, let's keep it simple and revoke all.
        $user->tokens()->delete();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'phone' => $user->phone,
                'role' => $user->role,
                'business_category' => $user->tenant?->business_category,
            ],
            'remember' => $request->remember // Tell frontend to store persistently
        ]);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate(['phone' => 'required|string']);

        $user = User::where('phone', $request->phone)->first();
        if (!$user) {
            // We return success anyway for security (don't leak user existence)
            // but in a small SaaS, maybe it's better to tell the user. 
            // I'll return error here as it's more helpful for salon owners.
            return response()->json(['message' => 'رقم الهاتف غير مسجل لدينا.'], 404);
        }

        $token = Str::random(64);
        
        DB::table('password_reset_tokens')->updateOrInsert(
            ['phone' => $request->phone],
            [
                'token' => Hash::make($token),
                'created_at' => now()
            ]
        );

        $frontendUrl = env('FRONTEND_URL', 'https://o2oeg.com');
        $resetUrl = "{$frontendUrl}/reset-password?token={$token}&phone={$request->phone}";

        $message = "مرحباً {$user->name} 🛡️\n\n" .
                   "لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في O2OEG.\n" .
                   "يمكنك تعيين كلمة مرور جديدة من خلال الضغط على الرابط التالي:\n\n" .
                   "{$resetUrl}\n\n" .
                   "⚠️ هذا الرابط صالح لمدة 30 دقيقة فقط.\n" .
                   "إذا لم تقم بطلب هذا الإجراء، يرجى تجاهل هذه الرسالة.";

        $whatsapp = new WhatsAppService();
        // Use a dedicated system session for security alerts to ensure delivery even if tenant session is down
        $systemSessionId = '00000000-0000-0000-0000-000000000000'; 
        $sent = $whatsapp->sendMessage($user->phone, $message, $systemSessionId);

        if ($sent) {
            return response()->json(['message' => 'تم إرسال رابط تعيين كلمة المرور إلى واتساب الخاص بك.']);
        }

        return response()->json(['message' => 'فشل إرسال الرسالة، يرجى المحاولة لاحقاً أو التواصل مع الدعم.'], 500);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
            'phone' => 'required|string',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $reset = DB::table('password_reset_tokens')
            ->where('phone', $request->phone)
            ->first();

        if (!$reset || !Hash::check($request->token, $reset->token)) {
            return response()->json(['message' => 'رابط غير صالح أو منتهي الصلاحية.'], 400);
        }

        if (Carbon::parse($reset->created_at)->addMinutes(30)->isPast()) {
            DB::table('password_reset_tokens')->where('phone', $request->phone)->delete();
            return response()->json(['message' => 'انتهت صلاحية هذا الرابط.'], 400);
        }

        $user = User::where('phone', $request->phone)->first();
        $user->password = Hash::make($request->password);
        $user->save();

        // Cleanup
        DB::table('password_reset_tokens')->where('phone', $request->phone)->delete();
        $user->tokens()->delete();

        return response()->json(['message' => 'تم تغيير كلمة المرور بنجاح، يمكنك تسجيل الدخول الآن.']);
    }

    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();

        return response()->json([
            'message' => 'تم تسجيل الخروج بنجاح'
        ]);
    }

    public function user(Request $request)
    {
        return response()->json([
            'data' => $request->user()
        ]);
    }

    /**
     * بيانات المستخدم الكاملة للـ Dashboard (مستخدمها SalonDashboard.tsx)
     */
    public function me(Request $request)
    {
        $user   = $request->user()->load(['tenant.services', 'tenant.activeSubscription.plan']);
        $tenant = $user->tenant;

        $subscription = $tenant?->activeSubscription;

        return response()->json([
            'user' => [
                'id'   => $user->id,
                'name' => $user->name,
                'role' => $user->role,
            ],
            'tenant' => $tenant ? [
                'id'   => $tenant->id,
                'name' => $tenant->name,
                'type' => $tenant->type ?? 'salon',
                'onboarding_completed' => (bool)$tenant->onboarding_completed,
                'phone' => $tenant->phone,
                'address' => $tenant->address,
                'description' => $tenant->description,
                'og_image_url' => $tenant->og_image_url,
                'latitude' => $tenant->latitude,
                'longitude' => $tenant->longitude,
                'google_ai_api_key' => $tenant->google_ai_api_key,
                'whatsapp_access_token' => $tenant->whatsapp_access_token,
                'whatsapp_phone_number_id' => $tenant->whatsapp_phone_number_id,
                'settings' => $tenant->settings,
                'services' => $tenant->services->map(function($s) {
                    return [
                        'id' => $s->id,
                        'name' => $s->name,
                        'slug' => $s->slug,
                        'status' => $s->pivot->status,
                        'global_status' => $s->status, // active, beta, disabled
                    ];
                }),
            ] : null,
            'subscription' => $subscription ? [
                'plan_id'    => $subscription->plan_id,
                'status'     => $subscription->status,
                'expires_at' => $subscription->ends_at,
            ] : null,
        ]);
    }

    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|unique:users,phone',
            'password' => 'required|string|min:6',
            'salon_name' => 'required|string|max:255',
        ]);

        return DB::transaction(function () use ($request) {
            // 1. Create Tenant
            $tenant = Tenant::create([
                'name' => $request->salon_name,
                'domain' => Str::slug($request->salon_name) . '-' . Str::random(5) . '.o2oeg.com',
                'status' => 'active',
                'business_category' => 'salon',
            ]);

            // 2. Create User
            $user = User::create([
                'name' => $request->name,
                'phone' => $request->phone,
                'password' => Hash::make($request->password),
                'role' => 'tenant_admin',
                'tenant_id' => $tenant->id,
            ]);

            // 3. Create FREE Subscription
            $freePlan = Plan::where('slug', 'free')->first();
            if ($freePlan) {
                Subscription::create([
                    'tenant_id' => $tenant->id,
                    'plan_id' => $freePlan->id,
                    'status' => 'active',
                    'starts_at' => now(),
                    'ends_at' => now()->addYears(10), // Forever free
                ]);
            }

            // 4. Activate Core Services
            $coreServices = Service::whereIn('slug', [
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

            // 5. Add Default Salon Services
            if ($tenant->business_category === 'salon') {
                $defaultServices = [
                    ['name' => 'قص شعر (حريمي/رجالي)', 'price' => 100],
                    ['name' => 'سشوار وبيبي ليس', 'price' => 150],
                    ['name' => 'صبغة شعر كاملة', 'price' => 500],
                    ['name' => 'تنظيف بشرة عميق', 'price' => 300],
                    ['name' => 'باديكير ومانيكير كامل', 'price' => 200],
                    ['name' => 'ميك اب سواريه', 'price' => 600],
                    ['name' => 'حمام مغربي أصلي', 'price' => 450],
                    ['name' => 'بروتين معالج للشعر', 'price' => 1200],
                ];
                
                foreach ($defaultServices as $svc) {
                    Service::create([
                        'tenant_id' => $tenant->id,
                        'name' => $svc['name'],
                        'slug' => Str::slug($svc['name']) . '-' . Str::random(5),
                        'target_audience' => 'salon',
                        'pricing_type' => 'free',
                        'price' => $svc['price'],
                        'status' => 'active'
                    ]);
                }
            }

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'access_token' => $token,
                'token_type' => 'Bearer',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'phone' => $user->phone,
                    'role' => $user->role,
                    'business_category' => $tenant->business_category,
                ],
                'message' => 'تم إنشاء الحساب وتفعيل الباقة المجانية بنجاح!'
            ], 201);
        });
    }
}

