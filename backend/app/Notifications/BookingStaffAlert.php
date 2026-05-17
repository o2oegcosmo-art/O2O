<?php

namespace App\Notifications;

use App\Channels\WhatsAppChannel;
use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class BookingStaffAlert extends Notification implements ShouldQueue
{
    use Queueable;

    protected $booking;

    public function __construct(Booking $booking)
    {
        $this->booking = $booking;
    }

    public function via($notifiable): array
    {
        return [WhatsAppChannel::class];
    }

    public function toWhatsApp($notifiable): array
    {
        $customer = $this->booking->customer;
        $service = $this->booking->service;
        $time = $this->booking->appointment_at;

        // رسالة نصية واضحة للموظف (الكوافير)
        $message = "🔔 إشعار حجز جديد!\n\n";
        $message .= "👤 العميل: " . ($customer->name ?? 'غير معروف') . "\n";
        $message .= "📞 هاتف: " . ($customer->phone ?? 'غير متوفر') . "\n";
        $message .= "💇‍♂️ الخدمة: " . ($service->name ?? 'غير محددة') . "\n";
        $message .= "⏰ الموعد: " . $time . "\n\n";
        $message .= "يرجى التحقق من لوحة التحكم للتفاصيل.";

        return [
            'body' => $message
        ];
    }
}
