<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\AffiliateProfile;
use App\Models\AffiliateClick;
use App\Models\AffiliateCommission;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AffiliateController extends Controller
{
    /**
     * تتبع النقرات عبر رابط الأفلييت
     */
    public function trackClick($code)
    {
        $profile = AffiliateProfile::where('promo_code', $code)
            ->where('status', 'active')
            ->firstOrFail();

        AffiliateClick::create([
            'affiliate_profile_id' => $profile->id,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);

        // تخزين الكود في الكوكيز لمدة 30 يوم
        return response()->json(['message' => 'Ref tracked'])
            ->cookie('o2oeg_ref', $code, 43200); // 30 days
    }

    /**
     * إحصائيات المسوق الحالي
     */
    public function stats()
    {
        $user = Auth::user();
        $profile = $user->affiliateProfile;

        if (!$profile) {
            return response()->json(['error' => 'Affiliate profile not found'], 404);
        }

        return response()->json([
            'promo_code' => $profile->promo_code,
            'commission_percentage' => $profile->commission_percentage,
            'balance' => $profile->balance,
            'total_earned' => $profile->total_earned,
            'clicks_count' => $profile->clicks()->count(),
            'referred_tenants_count' => $profile->referredTenants()->count(),
            'pending_commissions' => $profile->commissions()->where('status', 'pending')->sum('amount'),
        ]);
    }

    /**
     * قائمة العمولات للمسوق
     */
    public function commissions()
    {
        $profile = Auth::user()->affiliateProfile;
        
        return response()->json(
            $profile->commissions()->with('tenant')->latest()->paginate(15)
        );
    }

    /**
     * (Admin) قائمة جميع المسوقين
     */
    public function adminIndex()
    {
        return response()->json(
            AffiliateProfile::with('user')->latest()->paginate(20)
        );
    }

    /**
     * (Admin) إنشاء مسوق جديد
     */
    public function adminStore(Request $request)
    {
        $request->validate([
            'user_id' => 'required|uuid|exists:users,id',
            'promo_code' => 'required|string|unique:affiliate_profiles,promo_code',
            'commission_percentage' => 'required|numeric|min:0|max:100',
        ]);

        $profile = AffiliateProfile::create($request->all());

        // تحديث دور المستخدم ليكون مسوقاً
        $profile->user->update(['role' => 'affiliate']);

        return response()->json($profile, 201);
    }

    /**
     * (Admin) تحديث حالة العمولة (موافقة/دفع)
     */
    public function adminUpdateCommissionStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:approved,paid,rejected',
        ]);

        $commission = AffiliateCommission::findOrFail($id);
        $oldStatus = $commission->status;
        $commission->status = $request->status;
        $commission->save();

        // إذا تم الدفع، نحدث رصيد المسوق
        if ($request->status === 'paid' && $oldStatus !== 'paid') {
            $profile = $commission->profile;
            $profile->increment('total_earned', $commission->amount);
            $profile->decrement('balance', $commission->amount);
        } elseif ($request->status === 'approved' && $oldStatus === 'pending') {
            $profile = $commission->profile;
            $profile->increment('balance', $commission->amount);
        }

        return response()->json($commission);
    }

    /**
     * (Admin) صرف الرصيد للمسوق
     */
    public function adminPayout($id)
    {
        $profile = AffiliateProfile::findOrFail($id);
        $amount = $profile->balance;

        if ($amount <= 0) {
            return response()->json(['error' => 'No balance to payout'], 400);
        }

        DB::transaction(function () use ($profile, $amount) {
            // تحديث جميع العمولات "المعتمدة" لتصبح "مدفوعة"
            AffiliateCommission::where('affiliate_profile_id', $profile->id)
                ->where('status', 'approved')
                ->update(['status' => 'paid']);

            // تحديث رصيد المسوق
            $profile->increment('total_earned', $amount);
            $profile->balance = 0;
            $profile->save();
        });

        return response()->json(['message' => 'Payout successful', 'amount' => $amount]);
    }

    /**
     * (Admin) تبديل حالة المسوق (نشط/موقوف)
     */
    public function adminToggleStatus($id)
    {
        $profile = AffiliateProfile::findOrFail($id);
        $profile->status = $profile->status === 'active' ? 'inactive' : 'active';
        $profile->save();

        return response()->json(['message' => 'Status updated', 'status' => $profile->status]);
    }
}
