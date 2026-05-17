<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class TenantScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     */
    public function apply(Builder $builder, Model $model): void
    {
        // 🔒 SEC-001: System-Enforced Isolation
        // Check if we should bypass the scope (Admins or System Tasks)
        if ($this->shouldBypass()) {
            return;
        }

        $tenantId = $this->resolveTenantId();

        if ($tenantId) {
            $builder->where($model->getTable() . '.tenant_id', $tenantId);
        } else {
            // 🚨 SEC-002: Critical Security Fallback
            // If we are in a tenant-bound context but NO tenant is identified:
            // We MUST prevent data leak by adding an impossible condition or throwing an exception
            if (app()->bound('tenant.strict_mode') && app('tenant.strict_mode')) {
                Log::critical("SECURITY ALERT: Tenant-bound query attempted without tenant context!", [
                    'model' => get_class($model),
                    'url' => request()->fullUrl(),
                    'user' => Auth::id()
                ]);
                throw new \RuntimeException("Unauthorized: Missing Tenant Context for " . get_class($model));
            }

            // Fallback: Ensure no data is returned if tenant cannot be resolved in a secured request
            $builder->whereRaw('1 = 0');
        }
    }

    /**
     * Determine if the current context is a global admin or system process.
     */
    protected function shouldBypass(): bool
    {
        // 🧪 Allow forcing scope in console for tests
        if (app()->runningInConsole() && !config('tenant.force_scope_in_console', false)) {
            return true;
        }

        // Bypass if a "bypass" flag is explicitly set (Maintenance/System)
        if (config('tenant.bypass_scope', false)) {
            return true;
        }

        // 🛡️ SEC-003: Strict Role-Based Bypass
        // Only 'admin' role can see everything. Owners/Staff are strictly scoped.
        if (Auth::check() && Auth::user()->role === 'admin') {
            return true;
        }

        return false;
    }

    /**
     * Resolve the current tenant ID from session, token, or context.
     */
    protected function resolveTenantId()
    {
        if (Auth::check()) {
            return Auth::user()->tenant_id;
        }

        // Check for specific headers if used in bridge/internal APIs
        return request()->header('X-Tenant-ID');
    }
}
