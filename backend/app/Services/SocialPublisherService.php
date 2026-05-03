<?php

namespace App\Services;

use App\Models\SocialPost;
use App\Models\SocialPostLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SocialPublisherService
{
    protected $aiService;

    public function __construct(\App\Services\AIContentStudioService $aiService)
    {
        $this->aiService = $aiService;
    }

    public function generateContent(\App\Models\Tenant $tenant, $businessType, $campaignGoal, $offerDetails, $tone, $language)
    {
        return $this->aiService->generateSocialPost($tenant, $businessType, $campaignGoal, $offerDetails, $tone);
    }

    public function generateReelScript(\App\Models\Tenant $tenant, $service, $offer, $target, $language)
    {
        return $this->aiService->generateReelScript($tenant, $service, $offer, $target);
    }

    public function publishPost(SocialPost $post)
    {
        $tenantId = $post->tenant_id;
        $integration = \App\Models\TenantIntegration::where('tenant_id', $tenantId)->where('provider', 'facebook_meta')->first();

        if (!$integration) {
            $this->logFailure($post, ['error' => 'No Meta Integration found']);
            return false;
        }

        $credentials = $integration->credentials;
        $accessToken = $credentials['access_token'] ?? null;
        $pageId = $credentials['page_id'] ?? null;
        $instagramId = $credentials['instagram_business_id'] ?? null; // assuming they saved this during connect

        if (!$accessToken) {
            $this->logFailure($post, ['error' => 'Missing access token']);
            return false;
        }

        $success = false;

        if (in_array($post->platform, ['facebook', 'both']) && $pageId) {
            $res = $this->publishToFacebook($post, $pageId, $accessToken);
            $success = $success || $res;
        }

        if (in_array($post->platform, ['instagram', 'both']) && $instagramId) {
            $res = $this->publishToInstagram($post, $instagramId, $accessToken);
            $success = $success || $res;
        }

        if ($success) {
            $post->update(['status' => 'published', 'published_at' => now()]);
        } else {
            $post->update(['status' => 'failed']);
        }

        return $success;
    }

    private function publishToFacebook(SocialPost $post, $pageId, $accessToken)
    {
        $url = "https://graph.facebook.com/v21.0/{$pageId}/feed";
        
        $response = Http::withToken($accessToken)->post($url, $payload);
        
        SocialPostLog::create([
            'post_id' => $post->id,
            'response_payload' => $response->json(),
            'status' => $response->successful() ? 'fb_success' : 'fb_failed'
        ]);

        return $response->successful();
    }

    private function publishToInstagram(SocialPost $post, $instagramId, $accessToken)
    {
        // 1. Create Media Container
        $containerUrl = "https://graph.facebook.com/v21.0/{$instagramId}/media";
        $payload = [
            'caption' => $post->post_text,
        ];

        if ($post->post_type === 'reel') {
            $payload['media_type'] = 'REELS';
            $payload['video_url'] = $post->mediaAsset ? $post->mediaAsset->file_url : $post->image_url;
        } elseif ($post->post_type === 'story') {
            $payload['media_type'] = 'STORIES';
            if ($post->mediaAsset && $post->mediaAsset->type === 'video') {
                $payload['video_url'] = $post->mediaAsset->file_url;
            } else {
                $payload['image_url'] = $post->mediaAsset ? $post->mediaAsset->file_url : $post->image_url;
            }
        } else {
            // standard post
            $payload['image_url'] = $post->mediaAsset ? $post->mediaAsset->file_url : $post->image_url;
        }

        $response = Http::withToken($accessToken)->post($containerUrl, $payload);
        $data = $response->json();

        if (!$response->successful() || !isset($data['id'])) {
            SocialPostLog::create([
                'post_id' => $post->id,
                'response_payload' => $data,
                'status' => 'ig_container_failed'
            ]);
            return false;
        }

        $creationId = $data['id'];

        // 2. Publish Media
        $publishUrl = "https://graph.facebook.com/v21.0/{$instagramId}/media_publish";
        $pubResponse = Http::withToken($accessToken)->post($publishUrl, [
            'creation_id' => $creationId,
        ]);

        SocialPostLog::create([
            'post_id' => $post->id,
            'response_payload' => $pubResponse->json(),
            'status' => $pubResponse->successful() ? 'ig_success' : 'ig_publish_failed'
        ]);

        return $pubResponse->successful();
    }

    private function logFailure(SocialPost $post, $payload)
    {
        SocialPostLog::create([
            'post_id' => $post->id,
            'response_payload' => $payload,
            'status' => 'failed'
        ]);
        $post->update(['status' => 'failed']);
    }
}
