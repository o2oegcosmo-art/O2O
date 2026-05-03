<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IntegrationLog extends Model
{
    protected $fillable = [
        'tenant_id',
        'provider',
        'action',
        'ip_address',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}

