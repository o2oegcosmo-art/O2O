<?php

namespace App\Notifications;

use App\Channels\WhatsAppChannel;
use Illuminate\Notifications\Notification;

class TestSimpleTextNotification extends Notification
{
    protected $message;

    public function __construct($message)
    {
        $this->message = $message;
    }

    public function via($notifiable)
    {
        return [WhatsAppChannel::class];
    }

    public function toWhatsApp($notifiable)
    {
        // اختبار إرسال نص مباشر (الميزة الجديدة)
        return $this->message;
    }
}
