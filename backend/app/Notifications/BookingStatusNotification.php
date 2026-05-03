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
        return ['database', WhatsAppChannel::class];
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

        // تنسيق البيانات بما يتوافق مع Template الخاص بـ Meta Cloud API
        return [
            'template_name' => 'booking_update', // اسم التمبليت المعتمد في Meta Dashboard
            'components' => [
                ['type' => 'body', 'parameters' => [
                    ['type' => 'text', 'text' => $notifiable->name],
                    ['type' => 'text', 'text' => $statusMap[$this->booking->status] ?? 'تحديث جديد'],
                    ['type' => 'text', 'text' => $this->booking->service->name],
                    ['type' => 'text', 'text' => $this->booking->appointment_at],
                ]]
            ]
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
