<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContentCalendar extends Model
{
    protected $fillable = [
        'tenant_id',
        'week_start_date',
        'status',
    ];

    protected $casts = [
        'week_start_date' => 'date',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function posts()
    {
        return $this->hasMany(ContentPost::class, 'calendar_id');
    }
}

