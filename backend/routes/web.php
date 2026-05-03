<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    $paths = [
        public_path('index.html'),
        base_path('../public/index.html'),
        base_path('public/index.html'),
        '/var/www/u525164227/public/index.html'
    ];

    foreach ($paths as $path) {
        if (file_exists($path)) {
            return file_get_contents($path);
        }
    }
    
    return response("Frontend not found. Please check deployment.", 404);
});

// الحل القاتل: دعم الـ POST والـ GET في مسار الـ Web وتوجيهه للمحرك الصحيح
Route::match(['get', 'post'], '/login', [\App\Http\Controllers\Api\AuthController::class, 'login'])->name('login');

// مسار احتياطي للـ GET فقط لإظهار رسالة واضحة
Route::get('/login-status', function() {
    return response()->json(['status' => 'online', 'message' => 'Login system is active.']);
});

// المحرك الذكي لتحميل الواجهة من أي مسار متاح لجميع الروابط
Route::get('/{any}', function () {
    $paths = [
        public_path('index.html'),
        base_path('../public/index.html'),
        base_path('public/index.html'),
        '/var/www/u525164227/public/index.html'
    ];

    foreach ($paths as $path) {
        if (file_exists($path)) {
            return file_get_contents($path);
        }
    }

    return response()->json([
        'error' => 'Frontend build not found',
        'checked_paths' => $paths
    ], 404);
})->where('any', '.*');
