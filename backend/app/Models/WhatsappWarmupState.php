<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WhatsappWarmupState extends Model
{
    protected $fillable = [
        'tenant_id', 'current_daily_limit', 'last_updated_at'
    ];

    protected $casts = [
        'last_updated_at' => 'datetime'
    ];

    public function tenant() { return $this->belongsTo(Tenant::class); }
}
