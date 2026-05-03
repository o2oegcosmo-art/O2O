<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'tenant_id', 'title', 'description', 'image_url', 'type', 
        'is_promoted', 'priority_weight', 'target_roles', 
        'target_business_type', 'starts_at', 'ends_at', 'status'
    ];

    protected $casts = [
        'target_roles' => 'array',
        'is_promoted' => 'boolean',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function analytics()
    {
        return $this->hasMany(EventAnalytic::class);
    }
}
