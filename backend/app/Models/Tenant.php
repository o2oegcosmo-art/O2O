<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tenant extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'domain',
        'phone',
        'address',
        'settings',
        'status',
        'has_full_access',
        'google_ai_api_key',
        'whatsapp_access_token',
        'whatsapp_phone_number_id',
        'business_category',
        'onboarding_completed',
        'latitude',
        'longitude',
        'referred_by',
    ];

    protected $casts = [
        'settings' => 'array',
        'google_ai_api_key' => 'encrypted',
        'whatsapp_access_token' => 'encrypted',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function services(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Service::class, 'tenant_service')
                    ->withPivot('status', 'activated_at', 'expires_at', 'settings')
                    ->withTimestamps();
    }

    public function subscription()
    {
        return $this->hasOne(Subscription::class)->latestOfMany();
    }

    public function activeSubscription()
    {
        return $this->hasOne(Subscription::class)
            ->where('status', 'active')
            ->where('ends_at', '>', now())
            ->latestOfMany();
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function staff(): HasMany
    {
        return $this->hasMany(Staff::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    public function integrations(): HasMany
    {
        return $this->hasMany(TenantIntegration::class);
    }

    public function integrationLogs(): HasMany
    {
        return $this->hasMany(IntegrationLog::class);
    }

    public function contentCalendars(): HasMany
    {
        return $this->hasMany(ContentCalendar::class);
    }

    public function contentPosts(): HasMany
    {
        return $this->hasMany(ContentPost::class);
    }

    public function whatsappCampaigns(): HasMany
    {
        return $this->hasMany(WhatsappCampaign::class);
    }

    public function whatsappMessages(): HasMany
    {
        return $this->hasMany(WhatsappMessage::class);
    }

    public function whatsappWarmupState(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(WhatsappWarmupState::class);
    }

    public function whatsappOptOuts(): HasMany
    {
        return $this->hasMany(WhatsappOptOut::class);
    }

    public function socialPosts(): HasMany
    {
        return $this->hasMany(SocialPost::class);
    }

    public function mediaAssets(): HasMany
    {
        return $this->hasMany(MediaAsset::class);
    }

    public function referredBy(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(AffiliateProfile::class, 'referred_by');
    }
}

