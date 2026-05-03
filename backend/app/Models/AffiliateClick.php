<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class AffiliateClick extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'affiliate_profile_id',
        'ip_address',
        'user_agent',
    ];

    public function profile()
    {
        return $this->belongsTo(AffiliateProfile::class, 'affiliate_profile_id');
    }
}
