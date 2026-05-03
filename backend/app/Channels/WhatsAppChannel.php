<?php

namespace App\Channels;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class WhatsAppChannel
{
    /**
     * إرسال التنبيه المعطى.
     */
    public function send($notifiable, Notification $notification)
    {
        $messageData = $notification->toWhatsApp($notifiable);
        $to = $notifiable->routeNotificationFor('whatsapp', $notification) ?: $notifiable->phone;

        if (!$to) {
            Log::error("WhatsApp Channel: No phone number found for notifiable.");
            return;
        }

        // جلب بيانات الصالون (Tenant) للتحقق من وجود مفاتيح خاصة
        $tenant = null;
        if (isset($notifiable->tenant)) {
            $tenant = $notifiable->tenant;
        } elseif (method_exists($notifiable, 'tenant')) {
            $tenant = $notifiable->tenant()->first();
        }

        $accessToken = ($tenant && $tenant->whatsapp_access_token) 
            ? $tenant->whatsapp_access_token 
            : config('services.whatsapp.access_token');
            
        $phoneNumberId = ($tenant && $tenant->whatsapp_phone_number_id) 
            ? $tenant->whatsapp_phone_number_id 
            : config('services.whatsapp.phone_number_id');

        // Check if it's a template or a media/text message
        if (is_array($messageData) && isset($messageData['template'])) {
            $payload = [
                'messaging_product' => 'whatsapp',
                'to' => $to,
                'type' => 'template',
                'template' => $messageData['template']
            ];
        } elseif (is_array($messageData) && isset($messageData['template_name'])) {
            // Fallback for older style template array
            $payload = [
                'messaging_product' => 'whatsapp',
                'to' => $to,
                'type' => 'template',
                'template' => [
                    'name' => $messageData['template_name'],
                    'language' => ['code' => $messageData['language_code'] ?? 'ar'],
                    'components' => $messageData['components'] ?? []
                ]
            ];
        } elseif (is_array($messageData) && $this->isMediaMessage($messageData)) {
            $type = $this->getMediaType($messageData);
            $mediaContent = $messageData[$type];

            // إذا تم تمرير مسار ملف محلي (path)، نقوم برفعه أولاً للحصول على id
            if (isset($mediaContent['path']) && !isset($mediaContent['id']) && !isset($mediaContent['link'])) {
                $mediaId = $this->uploadMedia($mediaContent['path'], $phoneNumberId, $accessToken);
                if ($mediaId) {
                    $mediaContent['id'] = $mediaId;
                    unset($mediaContent['path']);
                }
            }

            $payload = [
                'messaging_product' => 'whatsapp',
                'to' => $to,
                'type' => $type,
                $type => $mediaContent
            ];
        } else {
            $payload = [
                'messaging_product' => 'whatsapp',
                'to' => $to,
                'type' => 'text',
                'text' => ['body' => is_array($messageData) ? ($messageData['body'] ?? '') : $messageData]
            ];
        }

        Log::info("WhatsApp Outgoing Payload", $payload);

        $response = Http::withToken($accessToken)
            ->withoutVerifying() 
            ->post("https://graph.facebook.com/v21.0/{$phoneNumberId}/messages", $payload);

        if ($response->failed()) {
            Log::error("WhatsApp API Failure", [
                'response' => $response->json(),
                'payload' => $payload
            ]);
        }

        return $response;
    }

    /**
     * التحقق مما إذا كانت الرسالة تحتوي على وسائط
     */
    private function isMediaMessage(array $data): bool
    {
        return isset($data['image']) || isset($data['document']) || isset($data['audio']) || isset($data['video']);
    }

    /**
     * استخراج نوع الوسائط من المصفوفة
     */
    private function getMediaType(array $data): string
    {
        return collect(['image', 'document', 'audio', 'video'])->first(fn($type) => isset($data[$type]));
    }

    /**
     * رفع الملف إلى Meta Cloud API للحصول على media_id
     */
    private function uploadMedia($path, $phoneNumberId, $accessToken)
    {
        if (!file_exists($path)) {
            Log::error("WhatsApp Media Upload: File not found at path: " . $path);
            return null;
        }

        // إنشاء مفتاح فريد يعتمد على مسار الملف وتاريخ تعديله
        $cacheKey = 'whatsapp_media_id_' . md5($path . filemtime($path));

        if (Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        $response = Http::withToken($accessToken)
            ->withoutVerifying()
            ->attach('file', file_get_contents($path), basename($path))
            ->post("https://graph.facebook.com/v21.0/{$phoneNumberId}/media", [
                'messaging_product' => 'whatsapp',
            ]);

        if ($response->successful()) {
            $mediaId = $response->json()['id'];
            
            // تخزين المعرف لمدة 29 يوماً (قبل انتهاء صلاحية Meta بيوم واحد)
            Cache::put($cacheKey, $mediaId, now()->addDays(29));
            
            return $mediaId;
        }

        Log::error("WhatsApp Media Upload Failed", [
            'path' => $path,
            'error' => $response->json()
        ]);

        return null;
    }
}
