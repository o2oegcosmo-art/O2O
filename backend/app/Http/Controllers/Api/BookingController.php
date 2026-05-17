<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Booking;
use App\Models\Service;
use App\Events\BookingStatusUpdated;
use App\Notifications\BookingStatusNotification;

class BookingController extends Controller
{
    /**
     * عرض قائمة الحجوزات للمستأجر الحالي
     */
    public function index(Request $request)
    {
        $tenant = $request->user()->tenant;
        
        $bookings = Booking::with(['customer', 'service', 'staff'])
            ->latest()
            ->paginate(50);
        
        return response()->json([
            'success' => true,
            'data' => $bookings
        ]);
    }

    /**
     * إنشاء حجز جديد (من قبل الـ Admin أو الـ AI)
     */
    public function store(Request $request)
    {
        $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'required|string',
            'service_id' => 'required',
            'appointment_at' => 'required|date',
            'staff_id' => 'nullable|exists:staff,id',
            'payment_method' => 'required|in:cash,wallet,instapay',
        ]);

        $tenant = $request->user()->tenant;
        $service = Service::findOrFail($request->service_id);

        $appointmentAt = \Illuminate\Support\Carbon::parse($request->appointment_at);
        $dayOfWeek = $appointmentAt->dayOfWeek; // 0 (Sunday) to 6 (Saturday)

        // التحقق من ساعات العمل (الأولوية للموظف المحدد، ثم إعدادات الصالون العامة)
        $workingHour = \App\Models\WorkingHour::where('tenant_id', $tenant->id)
            ->where(function($query) use ($request) {
                $query->where('staff_id', $request->staff_id)
                      ->orWhereNull('staff_id');
            })
            ->where('day_of_week', $dayOfWeek)
            ->orderByRaw('staff_id IS NULL ASC') // الموظف المحدد يأتي أولاً
            ->first();

        if ($workingHour) {
            $bookingTime = $appointmentAt->format('H:i:s');
            if ($workingHour->is_closed || $bookingTime < $workingHour->start_time || $bookingTime > $workingHour->end_time) {
                return response()->json([
                    'success' => false,
                    'message' => 'عذراً، الموعد المختار خارج ساعات العمل الرسمية لهذا الموظف أو الصالون.'
                ], 422);
            }
        }

        // منع التضارب (Anti Double Booking)
        if ($request->staff_id) {
            $conflict = Booking::where('staff_id', $request->staff_id)
                ->whereIn('status', ['pending', 'confirmed'])
                ->where(function($query) use ($appointmentAt) {
                    $query->whereBetween('appointment_at', [
                        $appointmentAt->copy()->subMinutes(59), 
                        $appointmentAt->copy()->addMinutes(59)
                    ]);
                })->exists();

            if ($conflict) {
                return response()->json([
                    'success' => false,
                    'message' => 'عذراً، هذا الموظف لديه حجز آخر في هذا الوقت. يرجى اختيار موعد أو موظف آخر.'
                ], 422);
            }
        }

        // تحديد الحالة بناءً على طريقة الدفع (كاش = مؤكد، الباقي = بانتظار التحقق)
        // ملاحظة: في المستقبل، سيتم فحص سياسة الصالون (هل يتطلب مقدم أم لا)
        $status = ($request->payment_method === 'cash') ? 'confirmed' : 'pending_payment';

        // البحث عن العميل بـ Hash الرقم (لأنه مشفر) داخل نفس الصالون، أو إنشاؤه إذا لم يوجد
        $phoneHash = hash('sha256', $request->customer_phone);
        $customer = $tenant->customers()->where('phone_hash', $phoneHash)->first();

        if (!$customer) {
            $customer = $tenant->customers()->create([
                'phone' => $request->customer_phone,
                'name' => $request->customer_name
            ]);
        }

        $booking = Booking::create([
            'tenant_id' => $tenant->id,
            'customer_id' => $customer->id,
            'service_id' => $service->id,
            'staff_id' => $request->staff_id,
            'appointment_at' => $request->appointment_at,
            'price' => $service->price,
            'payment_method' => $request->payment_method,
            'status' => $status
        ]);

        // Notification is now handled automatically by the BookingCreated event listener

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء الحجز بنجاح',
            'data' => $booking->load(['customer', 'service', 'staff'])
        ], 201);
    }

    /**
     * تحديث حالة الحجز (مؤكد، ملغي، مكتمل)
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:pending,confirmed,cancelled,completed',
            'price' => 'nullable|numeric|min:0'
        ]);
        
        $booking = Booking::where('tenant_id', $request->user()->tenant_id)->findOrFail($id);
        
        $updateData = ['status' => $request->status];
        
        // إذا تم تقديم سعر جديد عند اكتمال الخدمة، نقوم بتحديث السعر في السجل المالي
        if ($request->has('price') && $request->price !== null) {
            $updateData['price'] = $request->price;
        }

        $booking->update($updateData);

        // احتساب العمولة تلقائياً عند اكتمال الخدمة
        if ($request->status === 'completed' && $booking->staff_id) {
            $staff = \App\Models\Staff::find($booking->staff_id);
            if ($staff) {
                $finalPrice = $request->price ?? $booking->price;
                $commissionAmount = 0;
                
                if ($staff->fixed_commission > 0) {
                    $commissionAmount = $staff->fixed_commission;
                } elseif ($staff->commission_rate > 0) {
                    $commissionAmount = ($finalPrice * $staff->commission_rate) / 100;
                }

                if ($commissionAmount > 0) {
                    \App\Models\StaffCommission::updateOrCreate(
                        ['booking_id' => $booking->id],
                        [
                            'tenant_id' => $booking->tenant_id,
                            'staff_id' => $booking->staff_id,
                            'amount' => $commissionAmount,
                            'status' => 'pending',
                            'notes' => 'Generated automatically on completion'
                        ]
                    );
                }
            }

            // خصم المواد من المستودع
            $service = \App\Models\Service::with('materials.inventoryItem')->find($booking->service_id);
            if ($service && $service->materials) {
                foreach ($service->materials as $material) {
                    if ($material->inventoryItem) {
                        $material->inventoryItem->decrement('quantity_in_stock', $material->quantity_used);
                    }
                }
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث حالة الحجز'
        ]);
    }
}
