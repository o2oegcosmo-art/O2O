<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Service extends Model
{
    use HasFactory, HasUuids;

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($service) {
            if (empty($service->slug)) {
                $baseSlug = \Illuminate\Support\Str::slug($service->name);
                if (empty($baseSlug)) {
                    $baseSlug = 'service-' . \Illuminate\Support\Str::random(5);
                }
                // Add tenant prefix or random suffix to ensure uniqueness since slug is global unique
                $service->slug = $baseSlug . '-' . \Illuminate\Support\Str::random(6);
            }
        });
    }

    protected $fillable = [
        'tenant_id',
        'name',
        'slug',
        'description',
        'status',
        'target_audience',
        'pricing_type',
        'price',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function features(): HasMany
    {
        return $this->hasMany(ServiceFeature::class);
    }

    public function plans(): BelongsToMany
    {
        return $this->belongsToMany(Plan::class, 'plan_service');
    }

    public function tenants(): BelongsToMany
    {
        return $this->belongsToMany(Tenant::class, 'tenant_service')
                    ->withPivot('status', 'activated_at', 'expires_at', 'settings')
                    ->withTimestamps();
    }
}
