<?php

namespace App\Listeners;

use App\Events\BookingCreated;
use App\Events\BookingStatusUpdated;
use App\Notifications\BookingConfirmed;
use App\Notifications\BookingPendingPayment;
use App\Notifications\BookingCancelled;
use App\Notifications\BookingCompleted;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Log;

class SendWhatsAppNotification implements ShouldQueue
{
    /**
     * Handle the BookingCreated event.
     */
    public function handle(BookingCreated|BookingStatusUpdated $event): void
    {
        // Reload booking with necessary relations for notification
        $booking = $event->booking;
        $booking->loadMissing('customer', 'service', 'tenant');

        // Ensure customer exists and has a phone number
        if (!$booking->customer || !$booking->customer->phone) {
            Log::warning('Cannot send WhatsApp: customer or phone missing', [
                'booking_id' => $booking->id,
            ]);
            return;
        }

        // Determine which notification to send based on booking status
        $notification = match ($booking->status) {
            'confirmed' => new BookingConfirmed($booking),
            'pending_payment' => new BookingPendingPayment($booking),
            'cancelled' => new BookingCancelled($booking),
            'completed' => new BookingCompleted($booking),
            default => null,
        };

        if (!$notification) {
            Log::info('No WhatsApp notification for status', [
                'status' => $booking->status,
                'booking_id' => $booking->id,
            ]);
            return;
        }

        // Send notification to customer (queued automatically via ShouldQueue)
        Notification::send($booking->customer, $notification);

        Log::info('WhatsApp notification queued', [
            'booking_id' => $booking->id,
            'status' => $booking->status,
            'customer_phone' => $booking->customer->phone,
        ]);
    }
}
