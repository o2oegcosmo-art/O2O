<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\WhatsappCampaign;
use App\Models\Customer;
use App\Models\WhatsappMessage;
use App\Models\WhatsappOptOut;

class SendWhatsAppCampaignJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $campaign;

    public function __construct(WhatsappCampaign $campaign)
    {
        $this->campaign = $campaign;
    }

    public function handle()
    {
        $tenantId = $this->campaign->tenant_id;
        $dailyLimit = $this->campaign->daily_limit ?? 20;

        // Fetch customers with category filtering
        $query = Customer::where('tenant_id', $tenantId);
        
        $filters = $this->campaign->audience_filter_json;
        if (!empty($filters['category']) && $filters['category'] !== 'all') {
            $query->where('category', $filters['category']);
        }
        
        $customers = $query->get();

        $delaySeconds = 0;
        $dispatchedCount = 0;

        foreach ($customers as $customer) {
            if ($dispatchedCount >= $dailyLimit) {
                break; // Stop at daily limit to avoid ban
            }

            $phoneHash = hash('sha256', $customer->phone);
            
            // Check opt-out
            if (WhatsappOptOut::where('tenant_id', $tenantId)->where('phone_hash', $phoneHash)->exists()) {
                continue;
            }

            // Create message record
            $messageRecord = WhatsappMessage::create([
                'tenant_id' => $tenantId,
                'campaign_id' => $this->campaign->id,
                'customer_id' => $customer->id,
                'phone_hash' => $phoneHash,
                'message_text' => $this->campaign->message_template, // We could use AI to spin variations here
                'status' => 'queued'
            ]);

            // Add random delay between 30 and 90 seconds (Smart Delay Engine)
            $delaySeconds += rand(30, 90);
            
            SendSingleWhatsAppMessageJob::dispatch($messageRecord, $customer->phone)
                ->delay(now()->addSeconds($delaySeconds));

            $dispatchedCount++;
        }

        if ($dispatchedCount < $customers->count() && $customers->count() > 0) {
            // Partially sent, update status to paused so user knows it hit the daily limit
            $this->campaign->update(['status' => 'paused']);
        } else {
            // Fully dispatched
            $this->campaign->update(['status' => 'completed']);
        }
    }
}

