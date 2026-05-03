<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;

class BookingCancelled extends Notification implements ShouldQueue
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
        return "❌ نعتذر منك، تم إلغاء حجزك في صالون {$salonName}.\n\nإذا كان لديك أي استفسار، يسعدنا تواصلك معنا. نتمنى رؤيتك في وقت آخر! ✨";
    }

    public function toArray($notifiable): array
    {
        return [
            'booking_id' => $this->booking->id,
            'status' => 'cancelled',
            'tenant_id' => $this->booking->tenant_id,
            'customer_id' => $this->booking->customer_id,
        ];
    }
}
