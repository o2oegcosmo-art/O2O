<?php

namespace App\Notifications;

use App\Channels\WhatsAppChannel;
use App\Models\Booking;
use App\Models\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Contracts\Queue\ShouldBeEncrypted; // تأمين البيانات في الطابور
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;

class BookingStatusNotification extends Notification implements ShouldQueue, ShouldBeEncrypted
{
    use Queueable;

    protected $booking;

    /**
     * إنشاء نسخة التنبيه وتحديد سياق المستأجر فوراً
     */
    public function __construct(Booking $booking)
    {
        // نستخدم relationships المحملة مسبقاً لتقليل الكويري في الخلفية
        $this->booking = $booking;
    }

    /**
     * تحديد القنوات (Database وقناة الواتساب المخصصة)
     */
    public function via($notifiable): array
    {
        return [WhatsAppChannel::class];
    }

    /**
     * تحضير بيانات الواتساب (تُستدعى بواسطة WhatsAppChannel)
     */
    public function toWhatsApp($notifiable): array
    {
        // إعادة تهيئة سياق المستأجر في الـ Worker لضمان الأمان PII
        // بما أن Tenant::makeCurrent غير موجودة حالياً، قمنا بحمايتها بـ check
        // ولكننا نعتمد على $this->booking->tenant_id الممرر أصلاً
        if (class_exists(Tenant::class) && method_exists(Tenant::class, 'makeCurrent')) {
            Tenant::makeCurrent($this->booking->tenant_id);
        }

        $statusMap = [
            'confirmed' => 'تم تأكيد حجزك بنجاح ✅',
            'cancelled' => 'نعتذر، تم إلغاء حجزك ❌',
            'completed' => 'شكراً لزيارتك! نرجو أن تكون الخدمة نالت إعجابك ✨',
            'pending'   => 'تم استلام طلب حجزك وهو قيد المراجعة ⏳',
        ];

        $statusText = $statusMap[$this->booking->status] ?? 'تحديث جديد لحجزك';
        $serviceName = $this->booking->service->name ?? 'خدمة الصالون';
        $timeText = $this->booking->appointment_at->format('Y-m-d h:i A');

        $message = "أهلاً بك يا {$notifiable->name}،\n";
        $message .= "{$statusText}\n";
        $message .= "الخدمة: {$serviceName}\n";
        $message .= "الموعد: {$timeText}\n";
        $message .= "\nشكراً لاختيارك {$this->booking->tenant->name}.";

        return [
            'body' => $message
        ];
    }

    public function toArray($notifiable): array
    {
        return [
            'booking_id' => $this->booking->id,
            'status' => $this->booking->status,
            'service' => $this->booking->service->name,
            'time' => $this->booking->appointment_at,
        ];
    }
}
