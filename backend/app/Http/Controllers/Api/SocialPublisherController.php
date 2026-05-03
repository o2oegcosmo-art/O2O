<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SocialPost;
use App\Services\SocialPublisherService;
use Illuminate\Http\Request;

class SocialPublisherController extends Controller
{
    protected $publisher;

    public function __construct(SocialPublisherService $publisher)
    {
        $this->publisher = $publisher;
    }

    public function generateAiContent(Request $request)
    {
        $data = $request->validate([
            'business_type' => 'required|string',
            'campaign_goal' => 'required|string',
            'offer_details' => 'required|string',
            'tone' => 'required|string',
            'language' => 'required|string',
        ]);

        try {
            $content = $this->publisher->generateContent(
                $request->user()->tenant,
                $data['business_type'],
                $data['campaign_goal'],
                $data['offer_details'],
                $data['tone'],
                $data['language']
            );

            return response()->json($content);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    public function generateAiReelScript(Request $request)
    {
        $data = $request->validate([
            'service' => 'required|string',
            'offer' => 'required|string',
            'target' => 'required|string',
            'language' => 'required|string',
        ]);

        try {
            $content = $this->publisher->generateReelScript(
                $request->user()->tenant,
                $data['service'],
                $data['offer'],
                $data['target'],
                $data['language']
            );

            return response()->json($content);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    public function storeAndPublish(Request $request)
    {
        $data = $request->validate([
            'platform' => 'required|in:facebook,instagram,both',
            'post_type' => 'required|in:post,reel,story',
            'post_text' => 'nullable|string',
            'image_url' => 'nullable|url',
            'media_asset_id' => 'nullable|exists:media_assets,id',
            'action' => 'required|in:publish_now,schedule',
            'scheduled_at' => 'nullable|date|after:now'
        ]);

        $post = SocialPost::create([
            'tenant_id' => $request->user()->tenant_id,
            'platform' => $data['platform'],
            'post_type' => $data['post_type'],
            'post_text' => $data['post_text'] ?? '',
            'image_url' => $data['image_url'],
            'media_asset_id' => $data['media_asset_id'] ?? null,
            'status' => $data['action'] === 'schedule' ? 'scheduled' : 'draft',
            'scheduled_at' => $data['scheduled_at'] ?? null,
            'created_by' => $request->user()->id
        ]);

        if ($data['action'] === 'publish_now') {
            $success = $this->publisher->publishPost($post);
            if ($success) {
                return response()->json(['message' => 'Published successfully', 'post' => $post]);
            } else {
                return response()->json(['error' => 'Failed to publish post'], 400);
            }
        }

        return response()->json(['message' => 'Post scheduled successfully', 'post' => $post]);
    }

    public function index(Request $request)
    {
        $posts = SocialPost::where('tenant_id', $request->user()->tenant_id)->orderBy('created_at', 'desc')->get();
        return response()->json($posts);
    }
}
