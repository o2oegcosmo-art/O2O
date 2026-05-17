<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TenantIntegration;
use App\Models\IntegrationLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class IntegrationController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = $request->user()->tenant_id;
        $integrations = TenantIntegration::where('tenant_id', $tenantId)->get();

        return response()->json($integrations);
    }

    public function connect(Request $request)
    {
        $request->validate([
            'provider' => 'required|in:google_ai,whatsapp_meta,facebook_meta',
            'credentials' => 'required|array',
            'legal_consent' => 'required|accepted'
        ]);

        $tenantId = $request->user()->tenant_id;

        // Test Connection Logic before saving
        if (!$this->testConnection($request->provider, $request->credentials)) {
            return response()->json(['message' => 'Connection test failed. Please check your credentials.'], 400);
        }

        $integration = TenantIntegration::updateOrCreate(
            ['tenant_id' => $tenantId, 'provider' => $request->provider],
            [
                'credentials' => $request->credentials,
                'status' => true
            ]
        );

        IntegrationLog::create([
            'tenant_id' => $tenantId,
            'provider' => $request->provider,
            'action' => 'connect',
            'ip_address' => $request->ip()
        ]);

        return response()->json([
            'message' => 'Integration connected successfully',
            'integration' => $integration
        ]);
    }

    public function destroy(Request $request, $provider)
    {
        $tenantId = $request->user()->tenant_id;

        $integration = TenantIntegration::where('tenant_id', $tenantId)->where('provider', $provider)->first();

        if ($integration) {
            $integration->delete();
            
            IntegrationLog::create([
                'tenant_id' => $tenantId,
                'provider' => $provider,
                'action' => 'remove',
                'ip_address' => $request->ip()
            ]);
            
            return response()->json(['message' => 'Integration removed successfully']);
        }

        return response()->json(['message' => 'Integration not found'], 404);
    }

    public function test(Request $request, $provider)
    {
        $tenantId = $request->user()->tenant_id;
        $integration = TenantIntegration::where('tenant_id', $tenantId)->where('provider', $provider)->first();

        if (!$integration) {
            return response()->json(['message' => 'Integration not found'], 404);
        }

        if ($this->testConnection($provider, $integration->credentials)) {
            IntegrationLog::create([
                'tenant_id' => $tenantId,
                'provider' => $provider,
                'action' => 'test',
                'ip_address' => $request->ip()
            ]);
            return response()->json(['message' => 'Connection successful']);
        }

        return response()->json(['message' => 'Connection failed'], 400);
    }

    private function testConnection($provider, $credentials)
    {
        try {
            switch ($provider) {
                case 'google_ai':
                    $apiKey = $credentials['api_key'] ?? '';
                    $model = $credentials['model'] ?? 'gemini-1.5-pro';
                    $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";
                    $response = Http::post($url, [
                        'contents' => [
                            ['parts' => [['text' => 'ping']]]
                        ]
                    ]);
                    return $response->successful();

                case 'whatsapp_meta':
                    $phoneNumberId = $credentials['phone_number_id'] ?? '';
                    $accessToken = $credentials['access_token'] ?? '';
                    if(empty($phoneNumberId) || empty($accessToken)) return false;
                    
                    // Call Meta API to get the phone number info
                    $url = "https://graph.facebook.com/v17.0/{$phoneNumberId}";
                    $response = Http::withToken($accessToken)->get($url);
                    return $response->successful();

                case 'facebook_meta':
                    $pageId = $credentials['page_id'] ?? '';
                    $accessToken = $credentials['access_token'] ?? '';
                    if(empty($pageId) || empty($accessToken)) return false;

                    $url = "https://graph.facebook.com/v17.0/{$pageId}";
                    $response = Http::withToken($accessToken)->get($url);
                    return $response->successful();
                    
                default:
                    return false;
            }
        } catch (\Exception $e) {
            Log::error("Integration test failed for {$provider}: " . $e->getMessage());
            return false;
        }
    }
}

