<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CrmClient extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'tenant_id',
        'salon_name',
        'owner_name',
        'phone',
        'phone_hash',
        'city',
        'size',
        'tier',
        'monthly_spend',
        'last_visit_at',
        'latitude',
        'longitude'
    ];

    protected $casts = [
        'phone' => 'encrypted',
    ];

    protected static function boot()
    {
        parent::boot();
        static::saving(function ($model) {
            if ($model->isDirty('phone')) {
                $model->phone_hash = hash('sha256', $model->phone);
            }
        });
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function opportunities()
    {
        return $this->hasMany(CrmOpportunity::class);
    }

    public function orders()
    {
        return $this->hasMany(CrmOrder::class);
    }

    public function visits()
    {
        return $this->hasMany(CrmVisit::class);
    }

    public function stylists()
    {
        return $this->hasMany(CrmStylist::class);
    }
}
