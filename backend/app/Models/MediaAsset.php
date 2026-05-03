<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MediaAsset extends Model
{
    protected $fillable = [
        'tenant_id', 'type', 'file_url', 'thumbnail_url', 'duration'
    ];

    public function tenant() { return $this->belongsTo(Tenant::class); }
}
