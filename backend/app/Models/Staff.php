<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Staff extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'name',
        'specialization',
        'phone',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function crmVisits()
    {
        return $this->hasMany(CrmVisit::class);
    }

    public function opportunities()
    {
        return $this->hasMany(CrmOpportunity::class, 'assigned_rep_id');
    }
}

