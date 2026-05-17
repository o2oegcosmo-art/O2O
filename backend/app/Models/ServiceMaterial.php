<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ServiceMaterial extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'tenant_id',
        'service_id',
        'inventory_item_id',
        'quantity_used',
    ];

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function inventoryItem()
    {
        return $this->belongsTo(InventoryItem::class);
    }
}
