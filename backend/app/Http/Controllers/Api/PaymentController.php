<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Subscription;
use App\Models\Plan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Gate;

class PaymentController extends Controller
{
    /**
     * العميل يرسل إثبات الدفع (Manual Proof)
     */
    public function submitManualPayment(Request $request)
    {
        $tenant = $request->user()->tenant;

        $request->validate([
            'plan_id' => 'required|exists:plans,id',
            'payment_method' => 'required|string', 
            'sender_phone' => 'required|string',
            'receipt' => 'required|image|max:5120', 
        ]);

        // SEC-005 FIX: Always use Plan price from DB, never trust $request->amount
        $plan = Plan::findOrFail($request->plan_id);

        // 1. رفع صورة الإيصال
        $path = $request->file('receipt')->store('receipts', 'public');

        return \Illuminate\Support\Facades\DB::transaction(function () use ($tenant, $plan, $request, $path) {
            // 2. إنشاء اشتراك "قيد الانتظار" (Pending)
            $subscription = Subscription::create([
                'tenant_id' => $tenant->id,
                'plan_id' => $plan->id,
                'status' => 'pending',
                'starts_at' => now(),
                'ends_at' => now()->addMonth(),
            ]);

            // 3. إنشاء سجل الدفع
            $payment = Payment::create([
                'tenant_id' => $tenant->id,
                'subscription_id' => $subscription->id,
                'amount' => $plan->price, // Use DB price
                'currency' => 'EGP',
                'payment_method' => $request->payment_method,
                'sender_phone' => $request->sender_phone,
                'receipt_path' => $path,
                'status' => 'pending',
                'transaction_id' => 'MANUAL-' . strtoupper(uniqid()),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم استلام إثبات الدفع بنجاح. سيتم مراجعته وتفعيل الحساب خلال ساعات.',
                'payment' => $payment
            ]);
        });
    }

    /**
     * الأدمن يستعرض المدفوعات المعلقة
     */
    public function adminIndex(Request $request)
    {
        if (Gate::denies('admin-access')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $payments = Payment::with(['tenant', 'subscription.plan'])
            ->where('status', 'pending')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $payments
        ]);
    }

    /**
     * الأدمن يعتمد أو يرفض الدفع
     */
    public function adminVerify(Request $request, $id)
    {
        if (Gate::denies('admin-access')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        return \Illuminate\Support\Facades\DB::transaction(function () use ($id, $request) {
            // SEC-006 FIX: Use lockForUpdate to prevent race conditions during verification
            $payment = Payment::where('id', $id)
                ->where('status', 'pending')
                ->lockForUpdate()
                ->firstOrFail();

            $status = $request->status; // approved, rejected

            if ($status === 'approved') {
                $payment->update(['status' => 'completed']);
                
                // تفعيل الاشتراك المرتبط
                $subscription = $payment->subscription;
                $subscription->update([
                    'status' => 'active',
                    'starts_at' => now(),
                    'ends_at' => now()->addMonth(),
                ]);

                // تفعيل المستأجر إذا كان معطلاً
                if ($payment->tenant) {
                    $payment->tenant->update(['status' => 'active']);

                    // الربط بنظام العمولات (Sprint 6 - Affiliate Engine)
                    if ($payment->tenant->referred_by) {
                        $profile = \App\Models\AffiliateProfile::find($payment->tenant->referred_by);
                        if ($profile && $profile->status === 'active') {
                            $commissionAmount = ($payment->amount * $profile->commission_percentage) / 100;
                            
                            \App\Models\AffiliateCommission::create([
                                'affiliate_profile_id' => $profile->id,
                                'tenant_id' => $payment->tenant_id,
                                'subscription_id' => $subscription->id,
                                'amount' => $commissionAmount,
                                'status' => 'pending',
                            ]);
                        }
                    }
                }

                return response()->json(['success' => true, 'message' => 'تم تفعيل الاشتراك بنجاح!']);
            } else {
                $payment->update(['status' => 'failed', 'admin_notes' => $request->notes]);
                if ($payment->subscription) {
                    $payment->subscription->update(['status' => 'cancelled']);
                }
                
                return response()->json(['success' => true, 'message' => 'تم رفض عملية الدفع.']);
            }
        });
    }
}
