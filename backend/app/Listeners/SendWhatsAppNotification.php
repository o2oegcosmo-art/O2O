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

        // The system template is now the main source of truth for the 'pending' status
        // since the AI text message has been disabled during booking creation.

        // Use the unified Template-based notification for other status updates
        $notification = new \App\Notifications\BookingStatusNotification($booking);

        if (!$notification) {
            Log::info('No WhatsApp notification for status', [
                'status' => $booking->status,
                'booking_id' => $booking->id,
            ]);
            return;
        }

        // Send notification to customer (queued automatically via ShouldQueue)
        Notification::send($booking->customer, $notification);

        // --- NEW: Notify Staff (Coiffeur) ---
        if ($booking->staff && $booking->staff->phone) {
            $staffNotification = new \App\Notifications\BookingStaffAlert($booking);
            Notification::send($booking->staff, $staffNotification);
            
            Log::info('WhatsApp staff alert queued', [
                'booking_id' => $booking->id,
                'staff_phone' => $booking->staff->phone,
            ]);
        }

        Log::info('WhatsApp notification queued', [
            'booking_id' => $booking->id,
            'status' => $booking->status,
            'customer_phone' => $booking->customer->phone,
        ]);
    }
}

