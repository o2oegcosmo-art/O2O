<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\WhatsappMessage;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SendSingleWhatsAppMessageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $messageRecord;
    protected $phone;

    public function __construct(WhatsappMessage $messageRecord, $phone)
    {
        $this->messageRecord = $messageRecord;
        $this->phone = $phone;
    }

    public function handle()
    {
        // Double check campaign status if it was paused manually
        if ($this->messageRecord->campaign->status === 'paused') {
            return;
        }

        $tenant = $this->messageRecord->tenant;
        
        // Match AIController credential logic
        $phoneNumberId = $tenant->whatsapp_phone_number_id ?: config('services.whatsapp.phone_number_id');
        $accessToken = $tenant->whatsapp_access_token ?: config('services.whatsapp.access_token');
        
        // Handle Unofficial Bridge
        if ($phoneNumberId === 'unofficial' || config('services.whatsapp.use_bridge')) {
            Log::info('WHATSAPP_DEBUG: Sending via Unofficial Bridge', ['to' => $this->phone, 'tenant_id' => $tenant->id]);
            $response = Http::withoutVerifying()->post("http://127.0.0.1:9000/send", [
                'tenantId' => $tenant->id,
                'to' => $this->phone,
                'text' => $this->messageRecord->message_text,
            ]);
            
            if ($response->successful()) {
                $this->messageRecord->update(['status' => 'sent', 'sent_at' => now()]);
            } else {
                Log::error('WhatsApp Bridge Send Failed: ' . $response->body());
                $this->messageRecord->update(['status' => 'failed']);
            }
            return;
        }

        if (!$phoneNumberId || !$accessToken) {
            Log::error('WhatsApp Credentials Missing for tenant: ' . $tenant->id);
            $this->messageRecord->update(['status' => 'failed']);
            return;
        }

        $url = "https://graph.facebook.com/v21.0/{$phoneNumberId}/messages";
        
        $phone = $this->phone;
        $phone = preg_replace('/[^0-9]/', '', $phone);
        if (strpos($phone, '20') !== 0) {
            $phone = (strpos($phone, '0') === 0) ? '2' . $phone : '20' . $phone;
        }

        try {
            $response = Http::withToken($accessToken)->withoutVerifying()->post($url, [
                'messaging_product' => 'whatsapp',
                'to' => $phone,
                'type' => 'text',
                'text' => ['body' => $this->messageRecord->message_text]
            ]);

            if ($response->successful()) {
                $this->messageRecord->update(['status' => 'sent', 'sent_at' => now()]);
            } else {
                Log::error('WhatsApp Meta Send Failed: ' . $response->body());
                $this->messageRecord->update(['status' => 'failed']);
            }
        } catch (\Exception $e) {
            Log::error('WhatsApp Meta Exception: ' . $e->getMessage());
            $this->messageRecord->update(['status' => 'failed']);
        }
    }
}
