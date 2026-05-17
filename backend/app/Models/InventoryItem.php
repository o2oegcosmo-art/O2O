<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

use App\Traits\BelongsToTenant;

class InventoryItem extends Model
{
    use HasFactory, BelongsToTenant, HasUuids;

    protected $fillable = [
        'tenant_id',
        'name',
        'sku',
        'unit',
        'quantity_in_stock',
        'cost_per_unit',
        'price',
        'is_retail',
        'is_consumable',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
