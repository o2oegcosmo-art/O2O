<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    use HasUuids;

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($plan) {
            if (empty($plan->slug)) {
                $plan->slug = \Illuminate\Support\Str::slug($plan->name) ?: 'plan-' . \Illuminate\Support\Str::random(10);
            }
        });
    }

    protected $fillable = [
        'name', 'slug', 'description', 'price', 
        'billing_interval', 'trial_period_days', 'is_active'
    ];

    public function services(): BelongsToMany
    {
        return $this->belongsToMany(Service::class, 'plan_service');
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }
}
