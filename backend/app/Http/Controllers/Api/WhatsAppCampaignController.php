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

        // Dispatch job
        dispatch(new SendWhatsAppCampaignJob($campaign));

        return response()->json(['message' => 'Campaign started successfully']);
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
