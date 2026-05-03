<?php

namespace App\Services;

use App\Models\Tenant;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    /**
     * إرسال رسالة واتساب عبر Meta Cloud API
     */
    public function sendMessage($to, $message, Tenant $tenant)
    {
        $accessToken = $tenant->whatsapp_access_token;
        $phoneNumberId = $tenant->whatsapp_phone_number_id;

        if (!$accessToken || !$phoneNumberId) {
            Log::error("WhatsApp credentials missing for tenant: {$tenant->id}");
            return false;
        }

        try {
            $response = Http::withToken($accessToken)
                ->post("https://graph.facebook.com/v21.0/{$phoneNumberId}/messages", [
                    'messaging_product' => 'whatsapp',
                    'recipient_type' => 'individual',
                    'to' => $to,
                    'type' => 'text',
                    'text' => ['body' => $message]
                ]);

            if ($response->successful()) {
                return true;
            }

            Log::error("WhatsApp API Error: " . $response->body());
            return false;

        } catch (\Exception $e) {
            Log::error("WhatsApp Service Exception: " . $e->getMessage());
            return false;
        }
    }
}

