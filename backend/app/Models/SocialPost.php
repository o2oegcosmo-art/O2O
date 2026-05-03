<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SocialPost extends Model
{
    protected $fillable = [
        'tenant_id', 'platform', 'post_type', 'media_asset_id', 'post_text', 'image_url', 'status', 'scheduled_at', 'published_at', 'created_by'
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'published_at' => 'datetime',
    ];

    public function tenant() { return $this->belongsTo(Tenant::class); }
    public function logs() { return $this->hasMany(SocialPostLog::class, 'post_id'); }
}
