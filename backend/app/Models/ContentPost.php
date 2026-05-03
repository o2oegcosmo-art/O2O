<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContentPost extends Model
{
    protected $fillable = [
        'tenant_id',
        'calendar_id',
        'platform',
        'post_type',
        'title',
        'content_text',
        'hashtags',
        'image_prompt',
        'advice_json',
        'scheduled_at',
        'status',
    ];

    protected $casts = [
        'advice_json' => 'array',
        'scheduled_at' => 'datetime',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function calendar()
    {
        return $this->belongsTo(ContentCalendar::class, 'calendar_id');
    }
}
