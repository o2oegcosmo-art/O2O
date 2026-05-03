<?php

namespace App\Listeners;

use App\Events\BookingCreated;
use App\Events\BookingStatusUpdated;
use Illuminate\Support\Facades\Log;
use Illuminate\Contracts\Queue\ShouldQueue;

class LogNotificationActivity implements ShouldQueue
{
    /**
     * Handle booking notification events for audit logging.
     */
    public function handle(BookingCreated|BookingStatusUpdated $event): void
    {
        $booking = $event->booking;
        $booking->loadMissing('tenant');

        $context = [
            'booking_id' => $booking->id,
            'tenant_id' => $booking->tenant_id,
            'customer_id' => $booking->customer_id,
            'status' => $booking->status,
            'event' => $event instanceof BookingCreated ? 'created' : 'status_updated',
        ];

        if ($event instanceof BookingStatusUpdated) {
            $context['old_status'] = $event->oldStatus;
            $context['new_status'] = $event->newStatus;
        }

        Log::channel('stack')->info('Booking notification activity', $context);
    }
}
