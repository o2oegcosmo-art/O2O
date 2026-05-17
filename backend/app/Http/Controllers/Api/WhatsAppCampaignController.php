<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WhatsappCampaign;
use App\Models\WhatsappWarmupState;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use App\Jobs\SendWhatsAppCampaignJob;

class WhatsAppCampaignController extends Controller
{
    protected $aiService;

    public function __construct(\App\Services\AIContentStudioService $aiService)
    {
        $this->aiService = $aiService;
    }

    public function index(Request $request)
    {
        $tenantId = $request->user()->tenant_id;
        $campaigns = WhatsappCampaign::where('tenant_id', $tenantId)->orderBy('created_at', 'desc')->get();
        return response()->json($campaigns);
    }

    public function generateMessage(Request $request)
    {
        $data = $request->validate([
            'campaign_goal' => 'required|string',
            'service' => 'required|string',
        ]);

        try {
            $message = $this->aiService->generateWhatsAppMessage(
                $request->user()->tenant,
                $data['campaign_goal'],
                $data['service']
            );

            return response()->json(['message' => $message]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'AI drafting failed: ' . $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'message_template' => 'required|string',
            'audience_filter_json' => 'nullable|array',
        ]);

        $tenantId = $request->user()->tenant_id;

        // Fetch or create warmup state
        $warmup = WhatsappWarmupState::firstOrCreate(
            ['tenant_id' => $tenantId],
            ['current_daily_limit' => 20, 'last_updated_at' => now()]
        );

        $campaign = WhatsappCampaign::create([
            'tenant_id' => $tenantId,
            'name' => $data['name'],
            'message_template' => $data['message_template'],
            'audience_filter_json' => $data['audience_filter_json'] ?? [],
            'status' => 'draft',
            'daily_limit' => $warmup->current_daily_limit
        ]);

        return response()->json([
            'message' => 'Campaign created successfully',
            'campaign' => $campaign
        ]);
    }

    public function start(Request $request, $id)
    {
        $tenantId = $request->user()->tenant_id;
        $campaign = WhatsappCampaign::where('id', $id)->where('tenant_id', $tenantId)->firstOrFail();

        if ($campaign->status !== 'draft' && $campaign->status !== 'paused') {
            return response()->json(['error' => 'Campaign cannot be started from current status.'], 400);
        }

        $campaign->update(['status' => 'sending']);

        // Run synchronously and return diagnostic result
        $result = $this->runCampaignNow($campaign);

        return response()->json([
            'message'      => 'Campaign executed',
            'sent'         => $result['sent'],
            'failed'       => $result['failed'],
            'final_status' => $campaign->fresh()->status,
            'detail'       => $result['detail'],
        ]);
    }

    private function runCampaignNow(WhatsappCampaign $campaign): array
    {
        $tenantId   = $campaign->tenant_id;
        $dailyLimit = $campaign->daily_limit ?? 20;
        $tenant     = $campaign->tenant;
        $sentCount  = 0;
        $failedCount = 0;
        $detail      = [];

        \Log::info("[CAMPAIGN #{$campaign->id}] SYNC RUN started for tenant: {$tenantId}");

        $query   = \App\Models\Customer::where('tenant_id', $tenantId);
        $filters = $campaign->audience_filter_json;
        if (!empty($filters['category']) && $filters['category'] !== 'all') {
            $query->where('category', $filters['category']);
        }
        $customers = $query->get();

        \Log::info("[CAMPAIGN #{$campaign->id}] Found {$customers->count()} customers.");

        if ($customers->count() === 0) {
            $campaign->update(['status' => 'completed']);
            return ['sent' => 0, 'failed' => 0, 'detail' => ['No customers found for tenant: ' . $tenantId . ' with filters: ' . json_encode($filters)]];
        }

        foreach ($customers as $customer) {
            if ($sentCount >= $dailyLimit) break;

            $phoneHash = hash('sha256', $customer->phone);

            // Normalize phone
            $phone = preg_replace('/[^0-9]/', '', $customer->phone);
            if (strlen($phone) === 11 && str_starts_with($phone, '0')) {
                $phone = '2' . $phone;
            } elseif (strlen($phone) === 10) {
                $phone = '20' . $phone;
            }

            $msgRecord = \App\Models\WhatsappMessage::create([
                'tenant_id'    => $tenantId,
                'campaign_id'  => $campaign->id,
                'customer_id'  => $customer->id,
                'phone_hash'   => $phoneHash,
                'message_text' => $campaign->message_template,
                'status'       => 'queued',
            ]);

            try {
                \Log::info("[CAMPAIGN #{$campaign->id}] Sending to: {$phone} via tenant: {$tenant->id}");

                $response = \Illuminate\Support\Facades\Http::timeout(30)
                    ->post('http://127.0.0.1:9005/send', [
                        'tenantId' => $tenant->id,
                        'to'       => $phone,
                        'text'     => $campaign->message_template,
                    ]);

                $bridgeBody = $response->body();
                \Log::info("[CAMPAIGN #{$campaign->id}] Bridge response [{$response->status()}]: {$bridgeBody}");

                if ($response->successful()) {
                    $msgRecord->update(['status' => 'sent', 'sent_at' => now()]);
                    $sentCount++;
                    $detail[] = "✅ Sent to {$phone} | Bridge: {$bridgeBody}";
                } else {
                    $msgRecord->update(['status' => 'failed']);
                    $failedCount++;
                    $detail[] = "❌ Failed {$phone} [{$response->status()}]: {$bridgeBody}";
                }
            } catch (\Exception $e) {
                $msgRecord->update(['status' => 'failed']);
                $failedCount++;
                $detail[] = "❌ Exception {$phone}: " . $e->getMessage();
                \Log::error("[CAMPAIGN #{$campaign->id}] Exception: " . $e->getMessage());
            }
        }

        \Log::info("[CAMPAIGN #{$campaign->id}] Done. Sent: {$sentCount}, Failed: {$failedCount}");

        if ($sentCount > 0) {
            $campaign->update(['status' => 'completed']);
        } else {
            $campaign->update(['status' => 'paused']);
        }

        return ['sent' => $sentCount, 'failed' => $failedCount, 'detail' => $detail];
    }

    public function pause(Request $request, $id)
    {
        $tenantId = $request->user()->tenant_id;
        $campaign = WhatsappCampaign::where('id', $id)->where('tenant_id', $tenantId)->firstOrFail();

        if ($campaign->status !== 'sending') {
            return response()->json(['error' => 'Only sending campaigns can be paused.'], 400);
        }

        $campaign->update(['status' => 'paused']);

        return response()->json(['message' => 'Campaign paused successfully']);
    }

    public function stats(Request $request, $id)
    {
        $tenantId = $request->user()->tenant_id;
        $campaign = WhatsappCampaign::withCount([
            'messages as sent_count' => function ($query) { $query->where('status', 'sent'); },
            'messages as failed_count' => function ($query) { $query->where('status', 'failed'); },
            'messages as delivered_count' => function ($query) { $query->where('status', 'delivered'); }
        ])->where('id', $id)->where('tenant_id', $tenantId)->firstOrFail();

        return response()->json($campaign);
    }
}

