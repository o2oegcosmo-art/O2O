<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Log;

class Booking extends Model
{
    protected $fillable = [
        'tenant_id',
        'customer_id',
        'service_id',
        'staff_id',
        'appointment_at',
        'duration_minutes',
        'status',
        'price',
        'payment_method',
        'internal_notes',
    ];

    protected $casts = [
        'appointment_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class);
    }

    /**
     * Boot the model and dispatch events for booking lifecycle.
     */
    protected static function booted(): void
    {
        static::created(function (Booking $booking) {
            try {
                event(new \App\Events\BookingCreated($booking));
            } catch (\Throwable $e) {
                Log::error('Failed to dispatch BookingCreated event', [
                    'booking_id' => $booking->id,
                    'error' => $e->getMessage(),
                ]);
            }
        });

        static::updated(function (Booking $booking) {
            if ($booking->isDirty('status')) {
                try {
                    event(new \App\Events\BookingStatusUpdated(
                        $booking,
                        $booking->getOriginal('status'),
                        $booking->status
                    ));
                } catch (\Throwable $e) {
                    Log::error('Failed to dispatch BookingStatusUpdated event', [
                        'booking_id' => $booking->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        });
    }
}
