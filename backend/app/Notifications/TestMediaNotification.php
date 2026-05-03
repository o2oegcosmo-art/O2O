<?php

namespace App\Notifications;

use App\Channels\WhatsAppChannel;
use Illuminate\Notifications\Notification;

class TestMediaNotification extends Notification
{
    protected $imagePath;

    public function __construct($imagePath)
    {
        $this->imagePath = $imagePath;
    }

    public function via($notifiable)
    {
        return [WhatsAppChannel::class];
    }

    public function toWhatsApp($notifiable)
    {
        return [
            'image' => [
                'path' => $this->imagePath,
                'caption' => '🚀 تجربة إرسال الوسائط مع الرفع التلقائي والتخزين المؤقت!'
            ]
        ];
    }
}
