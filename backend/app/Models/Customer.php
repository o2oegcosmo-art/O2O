<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Notifications\Notifiable;

class Customer extends Model
{
    use Notifiable;

    protected $fillable = [
        'tenant_id',
        'name',
        'phone',
        'phone_hash',
        'email',
        'notes',
        'category',
    ];

    protected $casts = [
        'phone' => 'encrypted',
    ];

    /**
     * التشفير والهاش التلقائي للبحث
     */
    protected static function boot()
    {
        parent::boot();
        static::saving(function ($model) {
            if ($model->isDirty('phone')) {
                $model->phone_hash = hash('sha256', $model->phone);
            }
        });
    }

    /**
     * Route notifications for the WhatsApp channel.
     */
    public function routeNotificationForWhatsApp(): string
    {
        return $this->phone;
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }
}

