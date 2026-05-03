<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\TenantIntegration;

class UseTenantIntegration
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && $request->user()->tenant_id) {
            $tenantId = $request->user()->tenant_id;

            // SEC-004 FIX: Use caching with short TTL to avoid DB overhead per request 
            // and ensure isolation within the current request context.
            $integrations = \Illuminate\Support\Facades\Cache::remember(
                "tenant_integrations:{$tenantId}",
                now()->addMinutes(5),
                fn() => TenantIntegration::where('tenant_id', $tenantId)->where('status', true)->get()
            );

            foreach ($integrations as $integration) {
                if (!is_object($integration)) {
                    continue;
                }
                
                $credentials = $integration->credentials;

                switch ($integration->provider) {
                    case 'google_ai':
                        config(['services.google_ai.api_key' => $credentials['api_key'] ?? config('services.google_ai.api_key')]);
                        config(['services.google_ai.model' => $credentials['model'] ?? config('services.google_ai.model')]);
                        break;

                    case 'whatsapp_meta':
                        config(['services.whatsapp.phone_number_id' => $credentials['phone_number_id'] ?? config('services.whatsapp.phone_number_id')]);
                        config(['services.whatsapp.access_token' => $credentials['access_token'] ?? config('services.whatsapp.access_token')]);
                        config(['services.whatsapp.business_id' => $credentials['business_id'] ?? config('services.whatsapp.business_id')]);
                        break;

                    case 'facebook_meta':
                        config(['services.facebook.page_id' => $credentials['page_id'] ?? config('services.facebook.page_id')]);
                        config(['services.facebook.access_token' => $credentials['access_token'] ?? config('services.facebook.access_token')]);
                        break;
                }
            }
        }

        return $next($request);
    }
}

