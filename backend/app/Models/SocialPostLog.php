<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SocialPostLog extends Model
{
    protected $fillable = [
        'post_id', 'response_payload', 'status'
    ];

    protected $casts = [
        'response_payload' => 'array',
    ];

    public function post() { return $this->belongsTo(SocialPost::class, 'post_id'); }
}
