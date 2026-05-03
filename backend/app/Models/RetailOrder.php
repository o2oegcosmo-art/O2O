<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class RetailOrder extends Model
{
    use HasUuids;

    protected $fillable = [
        'tenant_id',
        'order_number',
        'customer_name',
        'customer_phone',
        'customer_address',
        'total_amount',
        'status',
        'notes',
    ];

    protected $casts = [
        'total_amount' => 'float',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function items()
    {
        return $this->hasMany(RetailOrderItem::class, 'order_id');
    }

    // توليد رقم طلب فريد
    public static function generateOrderNumber($tenantId): string
    {
        $count = self::where('tenant_id', $tenantId)->count() + 1;
        return 'ORD-' . date('Y') . '-' . str_pad($count, 5, '0', STR_PAD_LEFT);
    }
}
