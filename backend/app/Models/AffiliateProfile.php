<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class AffiliateProfile extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'promo_code',
        'commission_percentage',
        'balance',
        'total_earned',
        'status',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function clicks()
    {
        return $this->hasMany(AffiliateClick::class);
    }

    public function commissions()
    {
        return $this->hasMany(AffiliateCommission::class);
    }

    public function referredTenants()
    {
        return $this->hasMany(Tenant::class, 'referred_by');
    }
}

