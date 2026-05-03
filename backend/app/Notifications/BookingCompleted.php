<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;

class BookingCompleted extends Notification implements ShouldQueue
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
        return "✨ شكراً لزيارتك صالون {$salonName}!\n\nنتمنى أن تكون الخدمة قد نالت إعجابك. يسعدنا دائماً خدمتك ورؤيتك قريباً! ❤️";
    }

    public function toArray($notifiable): array
    {
        return [
            'booking_id' => $this->booking->id,
            'status' => 'completed',
            'tenant_id' => $this->booking->tenant_id,
            'customer_id' => $this->booking->customer_id,
        ];
    }
}
