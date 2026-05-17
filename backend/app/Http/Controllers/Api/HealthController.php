<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use GuzzleHttp\Client;
use Exception;

class HealthController extends Controller
{
    /**
     * 📊 SaaS Health Check and Monitoring Endpoint
     * Verifies DB, Redis, WhatsApp Bridge, Queue Workers, and Server Metrics
     */
    public function check(Request $request)
    {
        $status = 200;
        $report = [
            'status' => 'healthy',
            'timestamp' => now()->toIso8601String(),
            'services' => [],
            'server_metrics' => []
        ];

        // 1. MySQL Health Check
        try {
            DB::connection()->getPdo();
            $report['services']['database'] = [
                'status' => 'UP',
                'latency_ms' => $this->measureLatency(fn() => DB::select('SELECT 1'))
            ];
        } catch (Exception $e) {
            $status = 500;
            $report['status'] = 'unhealthy';
            $report['services']['database'] = [
                'status' => 'DOWN',
                'error' => $e->getMessage()
            ];
        }

        // 2. Redis Health Check
        try {
            $redis = Cache::store('redis')->getRedis();
            $redisPing = $redis->ping();
            $report['services']['redis'] = [
                'status' => $redisPing ? 'UP' : 'DOWN',
                'latency_ms' => $this->measureLatency(fn() => Cache::store('redis')->put('health_test', 1, 10))
            ];
        } catch (Exception $e) {
            // Log warning but don't strictly return 500 if DB fallback is active
            $report['services']['redis'] = [
                'status' => 'DOWN (Using DB Fallback)',
                'error' => $e->getMessage()
            ];
        }

        // 3. Queue Health Check
        try {
            $failedJobs = DB::table('failed_jobs')->count();
            $pendingJobs = DB::table('jobs')->count();
            $report['services']['queue'] = [
                'status' => 'UP',
                'pending_jobs' => $pendingJobs,
                'failed_jobs' => $failedJobs,
                'health_indicator' => ($failedJobs > 20) ? 'WARNING' : 'SECURE'
            ];
        } catch (Exception $e) {
            $report['services']['queue'] = [
                'status' => 'UNKNOWN',
                'error' => $e->getMessage()
            ];
        }

        // 4. WhatsApp Bridge Health Check
        $bridgeUrl = 'http://localhost:9005/status';
        try {
            $client = new Client();
            $start = microtime(true);
            $response = $client->get($bridgeUrl, ['timeout' => 3]);
            $end = microtime(true);
            
            if ($response->getStatusCode() === 200) {
                $bridgeData = json_decode($response->getBody()->getContents(), true);
                $report['services']['whatsapp_bridge'] = [
                    'status' => 'UP',
                    'latency_ms' => round(($end - $start) * 1000, 2),
                    'sessions_registered' => $bridgeData['sessionsRegistered'] ?? 0,
                    'sessions_active' => $bridgeData['sessionsActive'] ?? 0
                ];
            } else {
                $report['services']['whatsapp_bridge'] = [
                    'status' => 'DEGRADED',
                    'code' => $response->getStatusCode()
                ];
            }
        } catch (Exception $e) {
            $report['status'] = 'unhealthy';
            $report['services']['whatsapp_bridge'] = [
                'status' => 'DOWN',
                'error' => $e->getMessage()
            ];
        }

        // 5. Server Metrics (Disk, Memory, CPU)
        $diskFree = disk_free_space(base_path());
        $diskTotal = disk_total_space(base_path());
        $diskUsagePercent = round((1 - ($diskFree / $diskTotal)) * 100, 2);

        $report['server_metrics']['disk'] = [
            'free_bytes' => $diskFree,
            'free_human' => $this->formatBytes($diskFree),
            'usage_percent' => $diskUsagePercent,
            'status' => ($diskUsagePercent > 90) ? 'CRITICAL' : (($diskUsagePercent > 80) ? 'WARNING' : 'OK')
        ];

        // RAM & CPU (Works on Linux/VPS)
        if (strtoupper(substr(PHP_OS, 0, 3)) !== 'WIN') {
            // Memory Usage
            $free = shell_exec('free');
            $free = (string)trim($free);
            $free_arr = explode("\n", $free);
            if (isset($free_arr[1])) {
                $mem = preg_split('/\s+/', $free_arr[1]);
                $memUsagePercent = round($mem[2] / $mem[1] * 100, 2);
                $report['server_metrics']['memory'] = [
                    'total' => $this->formatBytes($mem[1] * 1024),
                    'used' => $this->formatBytes($mem[2] * 1024),
                    'usage_percent' => $memUsagePercent,
                    'status' => ($memUsagePercent > 90) ? 'CRITICAL' : 'OK'
                ];
            }

            // CPU Load
            $load = sys_getloadavg();
            $report['server_metrics']['cpu'] = [
                'load_1min' => $load[0],
                'load_5min' => $load[1],
                'load_15min' => $load[2],
                'status' => ($load[0] > 4) ? 'WARNING' : 'OK'
            ];
        } else {
            // Windows basic fallback
            $report['server_metrics']['memory'] = ['status' => 'N/A on Windows'];
            $report['server_metrics']['cpu'] = ['status' => 'N/A on Windows'];
        }

        // 🚨 6. Stage 3 Alerts Trigger System
        $shouldAlert = false;
        $alertMessage = "🚨 *O2OEG SYSTEM CRITICAL ALERT* 🚨\n\n";

        if ($report['status'] === 'unhealthy') {
            $shouldAlert = true;
            $alertMessage .= "⚠️ System Status: *UNHEALTHY*\n";
        }
        if ($diskUsagePercent > 90) {
            $shouldAlert = true;
            $alertMessage .= "💾 Disk Usage: *CRITICAL ({$diskUsagePercent}%)*\n";
        }
        if (isset($report['services']['whatsapp_bridge']) && $report['services']['whatsapp_bridge']['status'] === 'DOWN') {
            $shouldAlert = true;
            $alertMessage .= "📱 WhatsApp Bridge: *DOWN*\n";
        }
        if (isset($report['services']['database']) && $report['services']['database']['status'] === 'DOWN') {
            $shouldAlert = true;
            $alertMessage .= "🗄️ Database: *DOWN*\n";
        }

        if ($shouldAlert) {
            Log::critical("[SYSTEM_ALERT] " . str_replace('*', '', $alertMessage));
            $this->dispatchWhatsAppAlert($alertMessage);
        }

        return response()->json($report, $status);
    }

    /**
     * Dispatch WhatsApp Alert to Admin
     */
    private function dispatchWhatsAppAlert($message)
    {
        $adminPhone = '201044167626'; // Mahmoud William Phone
        try {
            $client = new Client();
            $client->post('http://localhost:9005/send', [
                'json' => [
                    'tenantId' => '00000000-0000-0000-0000-000000000000',
                    'to' => $adminPhone,
                    'text' => $message
                ],
                'timeout' => 5
            ]);
        } catch (Exception $e) {
            Log::error("[ALERT_SEND_FAILED] Could not send alert to {$adminPhone} via WhatsApp: " . $e->getMessage());
        }
    }

    private function measureLatency(callable $callback)
    {
        $start = microtime(true);
        $callback();
        $end = microtime(true);
        return round(($end - $start) * 1000, 2);
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
