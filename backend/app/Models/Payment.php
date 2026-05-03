<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasUuids;

    protected $fillable = [
        'tenant_id', 'subscription_id', 'amount', 'currency', 
        'payment_method', 'status', 'transaction_id', 'receipt_path', 
        'admin_notes', 'sender_phone', 'gateway_response'
    ];

    protected $casts = [
        'gateway_response' => 'array',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }
}