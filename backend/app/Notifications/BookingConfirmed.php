<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;

class BookingConfirmed extends Notification implements ShouldQueue
{
    use Queueable;

    public Booking $booking;

    public function __construct(Booking $booking)
    {
        $this->booking = $booking;
    }

    public function via($notifiable): array
    {
        return [\App\Channels\WhatsAppChannel::class];
    }

    public function toWhatsApp($notifiable): array|string
    {
        $salonName = $this->booking->tenant->name ?? 'Salon';
        $date = $this->booking->appointment_at->format('Y-m-d');
        $time = $this->booking->appointment_at->format('H:i');
        $service = $this->booking->service->name ?? 'الخدمة';
        $price = number_format($this->booking->price, 2);

        return "✅ تم تأكيد حجزك في صالون {$salonName}!\n\n📅 الموعد: {$date}\n⏰ الوقت: {$time}\n💇 الخدمة: {$service}\n💰 السعر: {$price} ج.م\n\nنحن بانتظارك! ✨";
    }

    public function toArray($notifiable): array
    {
        return [
            'booking_id' => $this->booking->id,
            'status' => 'confirmed',
            'tenant_id' => $this->booking->tenant_id,
            'customer_id' => $this->booking->customer_id,
        ];
    }
}

