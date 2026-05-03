<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyWhatsAppWebhook
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): mixed
    {
        // Skip verification in local dev if secret is not set
        $appSecret = config('services.whatsapp.app_secret');
        if (config('app.env') === 'local' && empty($appSecret)) {
            return $next($request);
        }

        $signature = $request->header('X-Hub-Signature-256');
        
        if (!$signature) {
            \Illuminate\Support\Facades\Log::warning('Missing WhatsApp Webhook signature', ['ip' => $request->ip()]);
            return response()->json(['error' => 'Missing signature'], 401);
        }

        $payload   = $request->getContent();
        $expected  = 'sha256=' . hash_hmac('sha256', $payload, $appSecret);

        if (!hash_equals($expected, $signature)) {
            \Illuminate\Support\Facades\Log::warning('WhatsApp Webhook signature mismatch', [
                'ip' => $request->ip(),
                'received' => $signature,
            ]);
            return response()->json(['error' => 'Invalid signature'], 403);
        }

        return $next($request);
    }
}
