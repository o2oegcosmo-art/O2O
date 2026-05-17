<?php

namespace App\Notifications;

use App\Models\Booking;
use App\Channels\WhatsAppChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;

class BookingStatusNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $booking;

    public function __construct(Booking $booking)
    {
        $this->booking = $booking;
    }

    public function via($notifiable): array
    {
        return ['database', WhatsAppChannel::class];
    }

    /**
     * تحضير بيانات القالب لقناة الواتساب
     */
    public function toWhatsApp($notifiable): array
    {
        $statusMap = [
            'pending'   => 'booking_received',
            'confirmed' => 'booking_confirmed',
            'cancelled' => 'booking_cancelled',
        ];

        $templateName = $statusMap[$this->booking->status] ?? 'booking_update';

        return [
            'template' => [
                'name' => $templateName,
                'language' => ['code' => 'ar'],
                'components' => [
                    [
                        'type' => 'body',
                        'parameters' => [
                            ['type' => 'text', 'text' => $notifiable->name],
                            ['type' => 'text', 'text' => $this->booking->service->name],
                            ['type' => 'text', 'text' => $this->booking->appointment_at->format('Y-m-d H:i')],
                        ]
                    ]
                ]
            ]
        ];
    }

    public function toArray($notifiable): array
    {
        return [
            'booking_id' => $this->booking->id,
            'status' => $this->booking->status,
            'message' => "تحديث لحجزك الخاص بـ " . $this->booking->service->name,
        ];
    }
}
