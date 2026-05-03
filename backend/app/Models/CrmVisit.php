<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CrmVisit extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'tenant_id',
        'staff_id',
        'crm_client_id',
        'visited_at',
        'notes',
        'latitude',
        'longitude',
        'outcome'
    ];

    public function staff()
    {
        return $this->belongsTo(Staff::class);
    }

    public function client()
    {
        return $this->belongsTo(CrmClient::class, 'crm_client_id');
    }
}

