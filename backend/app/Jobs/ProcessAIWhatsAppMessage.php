<?php

namespace App\Jobs;

use App\Models\Tenant;
use App\Http\Controllers\Api\AIController;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessAIWhatsAppMessage implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $tenant;
    protected $senderPhone;
    protected $incomingMessage;
    protected $phoneNumberId;

    /**
     * Create a new job instance.
     */
    public function __construct(Tenant $tenant, string $senderPhone, string $incomingMessage, ?string $phoneNumberId)
    {
        $this->tenant = $tenant;
        $this->senderPhone = $senderPhone;
        $this->incomingMessage = $incomingMessage;
        $this->phoneNumberId = $phoneNumberId;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info("Job Started: Processing AI WhatsApp Message", [
            'tenant_id' => $this->tenant->id,
            'from' => $this->senderPhone
        ]);

        // Resolve Controller via Container to ensure Security Service is injected
        $controller = app(AIController::class);
        
        $aiResponse = $controller->processMessageWithAI($this->tenant, $this->senderPhone, $this->incomingMessage);

        // تسجيل الاستخدام
        app(\App\Services\AIUsageService::class)->incrementUsage($this->tenant);

        // إرسال الرد
        if (isset($aiResponse['message']) && $this->phoneNumberId) {
            $controller->sendWhatsAppMessage($this->tenant, $this->phoneNumberId, $this->senderPhone, $aiResponse['message']);
        }

        // معالجة الحجز إذا وجد
        if (isset($aiResponse['action']) && $aiResponse['action'] === 'create_booking') {
            $controller->handleBookingAction($this->tenant, $this->senderPhone, $aiResponse['booking_details'], $this->phoneNumberId);
        }
    }
}
