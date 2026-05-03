<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WhatsappOptOut extends Model
{
    protected $fillable = [
        'tenant_id', 'phone_hash'
    ];

    public function tenant() { return $this->belongsTo(Tenant::class); }
}
