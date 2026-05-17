<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Exception;

class SystemCleanup extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'system:cleanup {--force : bypass confirm}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up temporary files, failed uploads, expired cache, and rotate logs to prevent VPS disk bloat';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("🧹 Starting Production Storage & Log Cleanup...");

        if (!$this->option('force') && !$this->confirm('⚠️ Are you sure you want to clean up system cache and temp directories?')) {
            $this->info('Cleanup aborted.');
            return 1;
        }

        $freedSpace = 0;

        // 1. Expired Cache Cleanup
        try {
            $this->info("⚡ Flushing expired cache...");
            Cache::flush();
            $this->line("   - System Cache flushed successfully.");
        } catch (Exception $e) {
            $this->error("❌ Failed to flush cache: " . $e->getMessage());
        }

        // 2. Temp Files and Failed Uploads Cleanup (files older than 24h)
        $tempDirs = [
            storage_path('app/temp'),
            storage_path('app/public/temp'),
            storage_path('framework/cache/data'),
        ];

        foreach ($tempDirs as $dir) {
            if (!file_exists($dir)) continue;

            $this->info("📂 Cleaning temp files in {$dir}...");
            $files = new \RecursiveIteratorIterator(
                new \RecursiveDirectoryIterator($dir, \RecursiveDirectoryIterator::SKIP_DOTS),
                \RecursiveIteratorIterator::CHILD_FIRST
            );

            foreach ($files as $fileinfo) {
                $filePath = $fileinfo->getRealPath();
                
                // If it's a file and older than 24 hours
                if ($fileinfo->isFile() && (time() - $fileinfo->getMTime() > 86400)) {
                    $freedSpace += $fileinfo->getSize();
                    unlink($filePath);
                    $this->line("   - Deleted old temp file: " . $fileinfo->getFilename());
                } elseif ($fileinfo->isDir() && $this->isDirEmpty($filePath)) {
                    rmdir($filePath);
                }
            }
        }

        // 3. Purging log files if they are huge or older than 7 days
        $logDir = storage_path('logs');
        if (file_exists($logDir)) {
            $this->info("📄 Rotating and checking size of log files...");
            $logFiles = glob("{$logDir}/*.log");
            foreach ($logFiles as $logFile) {
                $fileSize = filesize($logFile);
                if ($fileSize > 50 * 1024 * 1024) { // Larger than 50MB
                    $this->warn("⚠️ Log file " . basename($logFile) . " is too large (" . $this->formatBytes($fileSize) . "). Truncating...");
                    file_put_contents($logFile, ''); // Empty file
                    $freedSpace += $fileSize;
                }
            }
        }

        // 4. Cleanup Node.js WhatsApp Bridge Logs if any
        $waLogsFile = base_path('../whatsapp-bridge/error.log');
        if (file_exists($waLogsFile)) {
            $fileSize = filesize($waLogsFile);
            if ($fileSize > 20 * 1024 * 1024) { // Larger than 20MB
                $this->warn("⚠️ WhatsApp bridge log is too large (" . $this->formatBytes($fileSize) . "). Truncating...");
                file_put_contents($waLogsFile, '');
                $freedSpace += $fileSize;
            }
        }

        $this->info("🎉 Cleanup completed! Freed Space: " . $this->formatBytes($freedSpace));
        Log::info("[CLEANUP] Automated system cleanup freed " . $this->formatBytes($freedSpace));
        return 0;
    }

    private function isDirEmpty($dir)
    {
        if (!is_dir($dir)) return false;
        $handle = opendir($dir);
        while (false !== ($entry = readdir($handle))) {
            if ($entry != "." && $entry != "..") {
                closedir($handle);
                return false;
            }
        }
        closedir($handle);
        return true;
    }

    private function formatBytes($bytes, $precision = 2)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);
        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}
