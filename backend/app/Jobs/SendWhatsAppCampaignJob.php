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
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SendWhatsAppCampaignJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 3600; // 1 hour max for large campaigns

    protected $campaign;

    public function __construct(WhatsappCampaign $campaign)
    {
        $this->campaign = $campaign;
    }

    public function handle()
    {
        $tenantId   = $this->campaign->tenant_id;
        $dailyLimit = $this->campaign->daily_limit ?? 20;
        $tenant     = $this->campaign->tenant;

        Log::info("[CAMPAIGN #{$this->campaign->id}] ▶ Started for tenant: {$tenantId}");

        // ── Fetch matching customers ──────────────────────────────
        $query   = Customer::where('tenant_id', $tenantId);
        $filters = $this->campaign->audience_filter_json;

        if (!empty($filters['category']) && $filters['category'] !== 'all') {
            $query->where('category', $filters['category']);
        }

        $customers = $query->get();
        Log::info("[CAMPAIGN #{$this->campaign->id}] Found {$customers->count()} customers. Daily limit: {$dailyLimit}");

        if ($customers->count() === 0) {
            Log::warning("[CAMPAIGN #{$this->campaign->id}] No customers found with filters: " . json_encode($filters));
            $this->campaign->update(['status' => 'completed']);
            return;
        }

        // ── Send messages DIRECTLY to bridge (no secondary queue) ─
        $sentCount   = 0;
        $failedCount = 0;

        foreach ($customers as $customer) {

            if ($sentCount >= $dailyLimit) {
                Log::info("[CAMPAIGN #{$this->campaign->id}] Daily limit {$dailyLimit} reached. Stopping.");
                break;
            }

            $phoneHash = hash('sha256', $customer->phone);

            // Skip opted-out customers
            if (WhatsappOptOut::where('tenant_id', $tenantId)->where('phone_hash', $phoneHash)->exists()) {
                Log::info("[CAMPAIGN #{$this->campaign->id}] Skipped opted-out: {$customer->phone}");
                continue;
            }

            // Normalize Egyptian phone number → 20XXXXXXXXXX
            $phone = preg_replace('/[^0-9]/', '', $customer->phone);
            if (strlen($phone) === 11 && str_starts_with($phone, '0')) {
                $phone = '2' . $phone;      // 01xxxxxxxxx → 201xxxxxxxxx
            } elseif (strlen($phone) === 10) {
                $phone = '20' . $phone;     // 1xxxxxxxxx  → 201xxxxxxxxx
            }

            // Create message record
            $messageRecord = WhatsappMessage::create([
                'tenant_id'    => $tenantId,
                'campaign_id'  => $this->campaign->id,
                'customer_id'  => $customer->id,
                'phone_hash'   => $phoneHash,
                'message_text' => $this->campaign->message_template,
                'status'       => 'queued',
            ]);

            // ── Send directly to WhatsApp Bridge ─────────────────
            try {
                Log::info("[CAMPAIGN #{$this->campaign->id}] → Sending to: {$phone}");

                $response = Http::timeout(30)
                    ->post('http://127.0.0.1:9005/send', [
                        'tenantId' => $tenant->id,
                        'to'       => $phone,
                        'text'     => $this->campaign->message_template,
                    ]);

                if ($response->successful()) {
                    $messageRecord->update(['status' => 'sent', 'sent_at' => now()]);
                    Log::info("[CAMPAIGN #{$this->campaign->id}] ✅ Sent to: {$phone}");
                    $sentCount++;
                } else {
                    $messageRecord->update(['status' => 'failed']);
                    Log::error("[CAMPAIGN #{$this->campaign->id}] ❌ Bridge error for {$phone}: " . $response->body());
                    $failedCount++;
                }
            } catch (\Exception $e) {
                $messageRecord->update(['status' => 'failed']);
                Log::error("[CAMPAIGN #{$this->campaign->id}] ❌ Exception for {$phone}: " . $e->getMessage());
                $failedCount++;
            }

            // Anti-Ban: 8-15 second delay between each message
            if ($sentCount < $dailyLimit && $customer !== $customers->last()) {
                sleep(rand(8, 15));
            }
        }

        // ── Final status update ───────────────────────────────────
        Log::info("[CAMPAIGN #{$this->campaign->id}] ■ Done. Sent: {$sentCount}, Failed: {$failedCount}");

        if ($sentCount === 0 && $failedCount > 0) {
            $this->campaign->update(['status' => 'paused']); // All failed, allow retry
        } elseif ($sentCount < $customers->count() && $sentCount < $dailyLimit) {
            $this->campaign->update(['status' => 'paused']); // Hit limit
        } else {
            $this->campaign->update(['status' => 'completed']); // All sent ✅
        }
    }
}
