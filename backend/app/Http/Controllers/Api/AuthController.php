<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

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
}

