<?php

/**
 * سكربت محاكاة رسائل واتساب (Meta Cloud API Structure)
 * يستخدم لاختبار دورة الحجز الكاملة في AIController
 */

$url = "http://localhost:8000/api/webhooks/whatsapp";
$senderPhone = "01044167626";
$message = "أريد حجز موعد قص شعر غداً الساعة 5 مساءً";

$payload = [
    "entry" => [
        [
            "changes" => [
                [
                    "value" => [
                        "messaging_product" => "whatsapp",
                        "metadata" => [
                            "display_phone_number" => "123456789",
                            "phone_number_id" => "987654321"
                        ],
                        "messages" => [
                            [
                                "from" => $senderPhone,
                                "id" => "wamid.HBgL...",
                                "timestamp" => time(),
                                "text" => ["body" => $message],
                                "type" => "text"
                            ]
                        ]
                    ],
                    "field" => "messages"
                ]
            ]
        ]
    ],
    "object" => "whatsapp_business_account"
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type:application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$result = curl_exec($ch);
curl_close($ch);

echo "Simulation Result: \n" . $result . "\n";