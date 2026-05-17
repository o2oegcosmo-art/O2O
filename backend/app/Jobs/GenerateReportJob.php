<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\Tenant;
use Illuminate\Support\Facades\Log;

class GenerateReportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tenant;
    public $reportType;
    public $filters;

    public $tries = 3;
    public $backoff = [60, 120, 300];
    public $timeout = 300; // 5 minutes

    /**
     * Create a new job instance.
     */
    public function __construct(Tenant $tenant, string $reportType, array $filters = [])
    {
        $this->tenant = $tenant;
        $this->reportType = $reportType;
        $this->filters = $filters;
        $this->onQueue('reports');
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info("Generating Report: {$this->reportType} for Tenant: {$this->tenant->name}");
        // Report logic goes here
        // ...
        
        Log::info("Report Generated successfully.");
    }
}
