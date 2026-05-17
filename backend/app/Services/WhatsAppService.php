<?php

namespace App\Services;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    protected $client;
    protected $bridgeUrl;

    public function __construct()
    {
        $this->client = new Client();
        // Use 127.0.0.1 instead of localhost for better compatibility on most VPS environments
        $baseUrl = env('WHATSAPP_BRIDGE_URL', 'http://127.0.0.1:9005');
        $this->bridgeUrl = rtrim($baseUrl, '/');
    }

    /**
     * Send a WhatsApp message via the bridge.
     *
     * @param string $to Phone number (e.g., 201044167626)
     * @param string $text Message content
     * @param string $tenantId Tenant ID for session (default super admin)
     * @return bool
     */
    public function sendMessage(string $to, string $text, string $tenantId = '00000000-0000-0000-0000-000000000000'): bool
    {
        // Sanitize phone number
        $phone = preg_replace('/[^0-9]/', '', $to);
        if (strlen($phone) == 11 && str_starts_with($phone, '01')) {
            $phone = '2' . $phone;
        }

        try {
            Log::info("[WHATSAPP_SERVICE] Sending message to: " . $phone);
            
            $response = $this->client->post($this->bridgeUrl . '/send', [
                'json' => [
                    'tenantId' => $tenantId,
                    'to' => $phone,
                    'text' => $text,
                ],
                'timeout' => 15
            ]);

            if ($response->getStatusCode() === 200) {
                Log::info("[WHATSAPP_SERVICE] Message sent successfully to: " . $phone);
                return true;
            }

            Log::warning("[WHATSAPP_SERVICE] Bridge returned status: " . $response->getStatusCode());
            return false;

        } catch (\Exception $e) {
            Log::error("[WHATSAPP_SERVICE] Failed to send message: " . $e->getMessage());
            return false;
        }
    }
}
