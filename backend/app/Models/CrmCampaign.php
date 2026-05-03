<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CrmCampaign extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'tenant_id',
        'name',
        'message_body',
        'target_segment',
        'total_sent',
        'status'
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
