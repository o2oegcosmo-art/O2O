<?php

return [
    /*
    |--------------------------------------------------------------------------
    | WhatsApp Business API Configuration
    |--------------------------------------------------------------------------
    |
    | These credentials are used to authenticate with the WhatsApp Business API.
    | You can use either Twilio's WhatsApp API or Meta's WhatsApp Business API.
    |
    */

    'driver' => env('WHATSAPP_DRIVER', 'twilio'),

    'twilio' => [
        'account_sid' => env('TWILIO_ACCOUNT_SID'),
        'auth_token' => env('TWILIO_AUTH_TOKEN'),
        'whatsapp_from' => env('TWILIO_WHATSAPP_FROM'), // e.g., whatsapp:+14155238886
    ],

    'meta' => [
        'access_token' => env('META_WHATSAPP_ACCESS_TOKEN'),
        'phone_number_id' => env('META_WHATSAPP_PHONE_NUMBER_ID'),
        'business_account_id' => env('META_WHATSAPP_BUSINESS_ACCOUNT_ID'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Default Templates
    |--------------------------------------------------------------------------
    |
    | Arabic message templates for different booking states.
    | These can be customized per tenant in the future.
    |
    */

    'templates' => [
        'booking_confirmed' => '✅ تم تأكيد حجزك في {salon_name} يوم {date} الساعة {time} للخدمة: {service_name}. السعر: {price} ر.س',

        'pending_payment' => '⚠️ حجزك معلق في {salon_name}. يرجى الدفع عبر {payment_method} لتأكيد الموعد. الخدمة: {service_name} في {date} الساعة {time}',

        'reminder_24h' => '📅 تذكير: لديك موعد غداً في {salon_name} الساعة {time} للخدمة: {service_name}. نتمنى منك التأكد من الحضور.',

        'cancelled' => '❌ تم إلغاء حجزك في {salon_name}. نأسف لذلك. إذا كان لديك أي استفسار، يرجى التواصل معنا.',

        'completed' => '🎉 شكراً لزيارتك {salon_name}! نتمنى أن تكون راضياً عن الخدمة. ننتظرك مرة أخرى قريباً!',

        'ai_booking_confirmation' => '✅ تم إنشاء حجزك بنجاح عبر المساعد الذكي في {salon_name}. تاريخ: {date},time: {time}, الخدمة: {service_name}. السعر: {price} ر.س. سيتم تأكيده قريباً.',
    ],

    /*
    |--------------------------------------------------------------------------
    | Rate Limiting
    |--------------------------------------------------------------------------
    |
    | Rate limits to comply with WhatsApp Business API policies.
    |
    */

    'rate_limit' => [
        'messages_per_second' => env('WHATSAPP_RATE_LIMIT_PER_SECOND', 10),
        'messages_per_day' => env('WHATSAPP_DAILY_LIMIT', 100000),
    ],

    /*
    |--------------------------------------------------------------------------
    | Queue Configuration
    |--------------------------------------------------------------------------
    |
    | Notifications are queued for reliability. Configure separate queue
    | connection specific to WhatsApp if needed.
    |
    */

    'queue' => [
        'connection' => env('WHATSAPP_QUEUE_CONNECTION', 'database'),
        'queue_name' => env('WHATSAPP_QUEUE_NAME', 'whatsapp'),
        'retry_attempts' => env('WHATSAPP_RETRY_ATTEMPTS', 3),
        'retry_delay' => env('WHATSAPP_RETRY_DELAY', 60), // seconds
    ],
];
