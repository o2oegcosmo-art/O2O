<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContentCalendar;
use App\Models\ContentPost;
use App\Services\AIContentStudioService;
use Illuminate\Http\Request;

class ContentStudioController extends Controller
{
    protected $aiService;

    public function __construct(AIContentStudioService $aiService)
    {
        $this->aiService = $aiService;
    }

    public function getCalendar(Request $request)
    {
        $tenantId = $request->user()->tenant_id;
        $calendars = ContentCalendar::where('tenant_id', $tenantId)->with('posts')->latest()->get();
        return response()->json($calendars);
    }

    public function generateWeeklyPlan(Request $request)
    {
        try {
            $calendar = $this->aiService->generateWeeklyPlan($request->user()->tenant);
            return response()->json([
                'message' => 'Weekly plan generated successfully',
                'calendar' => $calendar
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    public function generatePost(Request $request)
    {
        if ($request->has('custom_topic')) {
            $request->validate([
                'custom_topic' => 'required|string',
                'platform' => 'nullable|string',
                'tone' => 'nullable|string'
            ]);

            try {
                $result = $this->aiService->generateCustomPost(
                    $request->user()->tenant,
                    $request->custom_topic,
                    $request->platform ?? 'Instagram',
                    $request->tone ?? 'احترافية وفاخرة'
                );
                return response()->json([
                    'message' => 'Custom post generated successfully',
                    'post' => $result
                ]);
            } catch (\Exception $e) {
                return response()->json(['error' => $e->getMessage()], 400);
            }
        }

        $request->validate([
            'post_id' => 'required|exists:content_posts,id'
        ]);

        $post = ContentPost::where('id', $request->post_id)
            ->whereHas('calendar', function($q) use ($request) {
                $q->where('tenant_id', $request->user()->tenant_id);
            })
            ->firstOrFail();

        try {
            $updatedPost = $this->aiService->generatePostContent($post);
            return response()->json([
                'message' => 'Post content generated successfully',
                'post' => $updatedPost
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    public function generateAdsAdvice(Request $request, $id)
    {
        $post = ContentPost::where('id', $id)
            ->whereHas('calendar', function($q) use ($request) {
                $q->where('tenant_id', $request->user()->tenant_id);
            })
            ->firstOrFail();

        try {
            $advice = $this->aiService->generateAdsAdvice($post);
            return response()->json([
                'message' => 'Ads advice generated successfully',
                'advice' => $advice
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    public function generateAdsStrategy(Request $request)
    {
        try {
            $strategy = $this->aiService->generateAdsStrategy($request->user()->tenant);
            return response()->json($strategy);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    public function generateProductDescription(Request $request)
    {
        $request->validate([
            'product_name' => 'required|string',
            'target_audience' => 'nullable|string'
        ]);

        try {
            $result = $this->aiService->generateProductDescription(
                $request->user()->tenant,
                $request->product_name,
                $request->target_audience ?? 'salons'
            );

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }
}

