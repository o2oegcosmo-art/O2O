<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WhatsappCampaign extends Model
{
    protected $fillable = [
        'tenant_id', 'name', 'message_template', 'audience_filter_json', 'status', 'daily_limit'
    ];

    protected $casts = [
        'audience_filter_json' => 'array'
    ];

    public function tenant() { return $this->belongsTo(Tenant::class); }
    public function messages() { return $this->hasMany(WhatsappMessage::class, 'campaign_id'); }
}

