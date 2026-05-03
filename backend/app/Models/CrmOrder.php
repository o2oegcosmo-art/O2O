<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CrmOrder extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'tenant_id',
        'crm_client_id',
        'total_amount',
        'status',
        'notes'
    ];

    public function items()
    {
        return $this->hasMany(CrmOrderItem::class);
    }

    public function client()
    {
        return $this->belongsTo(CrmClient::class, 'crm_client_id');
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
