<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkingHour extends Model
{
    protected $fillable = [
        'tenant_id',
        'staff_id',
        'day_of_week',
        'start_time',
        'end_time',
        'is_closed',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function staff()
    {
        return $this->belongsTo(Staff::class);
    }
}
