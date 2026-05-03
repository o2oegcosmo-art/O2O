<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CrmStylist extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'tenant_id',
        'crm_client_id',
        'name',
        'specialization',
        'phone'
    ];

    public function certifications()
    {
        return $this->hasMany(CrmStylistCertification::class);
    }

    public function client()
    {
        return $this->belongsTo(CrmClient::class, 'crm_client_id');
    }
}
