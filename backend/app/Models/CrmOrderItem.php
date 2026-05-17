<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CrmOrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'crm_order_id',
        'product_id',
        'quantity',
        'price_at_order'
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}

