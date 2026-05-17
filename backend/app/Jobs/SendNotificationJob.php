<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class SendNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $user;
    public $message;
    public $type;

    public $tries = 5;
    public $backoff = [10, 30, 60, 120, 300];
    public $timeout = 60;

    /**
     * Create a new job instance.
     */
    public function __construct(User $user, string $message, string $type = 'system')
    {
        $this->user = $user;
        $this->message = $message;
        $this->type = $type;
        $this->onQueue('notifications');
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info("Sending Notification [{$this->type}] to User: {$this->user->id}");
        // Notification logic here
        // ...
    }
}
