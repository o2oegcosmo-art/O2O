<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupportTicket extends \Illuminate\Database\Eloquent\Model
{
    use \Illuminate\Database\Eloquent\Concerns\HasUuids;

    protected $fillable = [
        'tenant_id',
        'subject',
        'description',
        'status',
        'priority'
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}

