<?php

namespace App\Traits;

use App\Models\Scopes\TenantScope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

trait BelongsToTenant
{
    /**
     * The "boot" method of the model trait.
     */
    protected static function bootBelongsToTenant(): void
    {
        // 🛡️ TASK 2.A: Automatic Global Scope Application
        static::addGlobalScope(new TenantScope);

        // 🏗️ TASK 2.B: Automatic Tenant Assignment
        static::creating(function ($model) {
            if (empty($model->tenant_id)) {
                $tenantId = null;

                if (Auth::check()) {
                    $tenantId = Auth::user()->tenant_id;
                } elseif (request()->header('X-Tenant-ID')) {
                    $tenantId = request()->header('X-Tenant-ID');
                }

                if ($tenantId) {
                    $model->tenant_id = $tenantId;
                    Log::info("AUDIT: Created " . get_class($model) . " for Tenant [$tenantId]", [
                        'user_id' => Auth::id(),
                        'data' => $model->getAttributes()
                    ]);
                } else {
                    // 🚨 TASK 2.C: Protection Against Missing Tenant Context
                    Log::emergency("SECURITY ALERT: Attempted to create " . get_class($model) . " without tenant_id!");
                    
                    if (!app()->runningInConsole()) {
                        throw new \RuntimeException("Critical Error: Missing Tenant ID for " . get_class($model));
                    }
                }
            }
        });

        // 📝 TASK 9: Audit Trail for Deletion
        static::deleted(function ($model) {
            Log::info("AUDIT: Deleted " . get_class($model) . " [ID: {$model->id}] from Tenant [{$model->tenant_id}]", [
                'user_id' => Auth::id()
            ]);
        });
    }

    /**
     * Helper to bypass the scope explicitly (Admins/System)
     */
    public static function withoutTenant()
    {
        return static::withoutGlobalScope(TenantScope::class);
    }

    /**
     * Tenant Relationship
     */
    public function tenant()
    {
        return $this->belongsTo(\App\Models\Tenant::class);
    }
}
