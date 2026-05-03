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

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'phone' => 'required|string', // This field will accept either email or phone
            'password' => 'required',
        ]);

        // Check if the input is an email or phone
        $user = User::where(function($query) use ($request) {
            $query->where('phone', $request->phone)
                  ->orWhere('email', $request->phone);
        })->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'phone' => ['بيانات الدخول غير صحيحة.'],
            ]);
        }

        // Revoke all previous tokens for this user for security
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
            ]
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

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
                'settings' => $tenant->settings,
                'services' => $tenant->services->map(function($s) {
                    return [
                        'id' => $s->id,
                        'name' => $s->name,
                        'slug' => $s->slug,
                        'status' => $s->pivot->status,
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
                'booking-engine',
                'basic-crm',
                'public-salon-page',
                'manual-payments',
                'basic-dashboard',
                'retail-store' // إضافة المتجر وسوق الجملة مجاناً
            ])->get();

            foreach ($coreServices as $service) {
                $tenant->services()->attach($service->id, [
                    'status' => 'active',
                    'activated_at' => now(),
                ]);
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

