<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class StaffCommission extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'tenant_id',
        'staff_id',
        'booking_id',
        'amount',
        'status',
        'notes',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function staff()
    {
        return $this->belongsTo(Staff::class);
    }

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }
}
