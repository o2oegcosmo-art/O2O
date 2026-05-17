<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lead extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'business_name',
        'business_type',
        'email',
        'phone',
        'governorate',
        'interest_type',
        'social_link',
        'status',
        'message',
        'ref_code',
    ];
}

