<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TenantIntegration extends Model
{
    protected $fillable = [
        'tenant_id',
        'provider',
        'credentials',
        'status',
    ];

    protected $casts = [
        'credentials' => 'encrypted:array',
        'status' => 'boolean',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}

