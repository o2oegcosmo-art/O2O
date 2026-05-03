<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\SocialPost;
use App\Services\SocialPublisherService;

class PublishScheduledSocialPosts extends Command
{
    protected $signature = 'social:publish-scheduled';
    protected $description = 'Publish all scheduled social media posts whose time has come.';

    public function handle(SocialPublisherService $publisherService)
    {
        $posts = SocialPost::where('status', 'scheduled')
            ->where('scheduled_at', '<=', now())
            ->get();

        foreach ($posts as $post) {
            $this->info("Publishing post ID: {$post->id}");
            $publisherService->publishPost($post);
        }

        $this->info("Finished publishing " . $posts->count() . " scheduled posts.");
    }
}
