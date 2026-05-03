<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WhatsappMessage extends Model
{
    protected $fillable = [
        'tenant_id', 'campaign_id', 'customer_id', 'phone_hash', 'message_text', 'status', 'sent_at'
    ];

    protected $casts = [
        'sent_at' => 'datetime'
    ];

    public function tenant() { return $this->belongsTo(Tenant::class); }
    public function campaign() { return $this->belongsTo(WhatsappCampaign::class, 'campaign_id'); }
    public function customer() { return $this->belongsTo(Customer::class); }
}

