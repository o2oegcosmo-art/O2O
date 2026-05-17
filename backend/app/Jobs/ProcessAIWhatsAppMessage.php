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
    protected $senderName;
    protected $incomingMessage;
    protected $phoneNumberId;
    protected $realPhone;

    /**
     * عدد محاولات إعادة التشغيل في حال الفشل
     */
    public $tries = 3;

    /**
     * الوقت بالثواني قبل إعادة المحاولة (Exponential Backoff)
     */
    public $backoff = [60, 300, 600];

    /**
     * تحديد الحد الأقصى لوقت التنفيذ بالثواني (5 دقائق)
     * ضروري لأن معالجة الذكاء الاصطناعي المحلي والصوت تستغرق وقتاً
     */
    public $timeout = 300;

    /**
     * Create a new job instance.
     */
    public function __construct(Tenant $tenant, string $senderPhone, string $incomingMessage, ?string $phoneNumberId, string $senderName = 'عميل واتساب', ?string $realPhone = null)
    {
        $this->tenant = $tenant;
        $this->senderPhone = $senderPhone;
        $this->senderName = $senderName;
        $this->incomingMessage = $incomingMessage;
        $this->phoneNumberId = $phoneNumberId;
        $this->realPhone = $realPhone;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info("Job Started: Processing AI WhatsApp Message", [
            'tenant_id' => $this->tenant->id,
            'from' => $this->senderPhone,
            'name' => $this->senderName
        ]);

        // 🟢 تأكيد وجود العميل في قاعدة البيانات وتحديث اسمه إذا كان مجهولاً
        // نستخدم الرقم الحقيقي للهوية إذا توفر، وإلا نستخدم الرقم المرسل (LID)
        $idForDb = $this->realPhone ?: $this->senderPhone;
        $phoneHash = hash('sha256', $idForDb);
        $customer = $this->tenant->customers()->where('phone_hash', $phoneHash)->first();
        
        if (!$customer) {
            $this->tenant->customers()->create([
                'phone' => $idForDb,
                'name' => $this->senderName ?: 'عميل واتساب',
                'phone_hash' => $phoneHash
            ]);
        } elseif ($customer->name === 'عميل واتساب' && $this->senderName && $this->senderName !== 'عميل واتساب') {
            $customer->update(['name' => $this->senderName]);
        }

        // Resolve Controller via Container to ensure Security Service is injected
        $controller = app(AIController::class);
        
        $aiResponse = $controller->processMessageWithAI($this->tenant, $this->senderPhone, $this->incomingMessage);

        // تسجيل الاستخدام
        app(\App\Services\AIUsageService::class)->incrementUsage($this->tenant);

        // إرسال الرد النصي من الذكاء الاصطناعي فقط إذا لم يكن الإجراء هو إنشاء حجز
        // لأن إنشاء الحجز سيتولى إرسال إشعار رسمي (Template)
        if (isset($aiResponse['message']) && $this->phoneNumberId && (!isset($aiResponse['action']) || $aiResponse['action'] !== 'create_booking')) {
            $controller->sendWhatsAppMessage($this->tenant, $this->phoneNumberId, $this->senderPhone, $aiResponse['message']);
        }

        // معالجة الحجز إذا وجد
        if (isset($aiResponse['action']) && $aiResponse['action'] === 'create_booking') {
            $controller->handleBookingAction($this->tenant, $this->senderPhone, $aiResponse['booking_details'], $this->phoneNumberId, $this->realPhone);
        }
    }
}

