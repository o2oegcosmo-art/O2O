<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'tenant_id',
        'name',
        'description',
        'wholesale_price',
        'retail_price',
        'stock_quantity',
        'image_url',
        'category',
        'is_active',
        'status',
        'rejection_reason',
        'reviewed_at'
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}

