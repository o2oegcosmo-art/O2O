<?php

use Illuminate\Support\Facades\Route;

// المحرك الذكي والقوي لتحميل الواجهة من أي مسار متاح
function serveFrontend() {
    $paths = [
        public_path('index.html'),
        base_path('../public/index.html'),
        base_path('public/index.html'),
        '/var/www/o2oeg/backend/public/index.html',
        '/var/www/o2oeg/public/index.html',
        '/var/www/u525164227/public/index.html',
        '/var/www/u525164227/backend/public/index.html'
    ];

    foreach ($paths as $path) {
        if (file_exists($path)) {
            return file_get_contents($path);
        }
    }
    
    return response("System is updating... Please refresh in 1 minute. (Frontend Not Found)", 404);
}

Route::get('/', function () {
    return serveFrontend();
});

// دعم الـ POST والـ GET في مسار الـ login
Route::match(['get', 'post'], '/login', [\App\Http\Controllers\Api\AuthController::class, 'login'])->name('login');

Route::get('/login-status', function() {
    return response()->json(['status' => 'online', 'message' => 'Login system is active.']);
});

// المحرك الذكي لجميع الروابط الأخرى
Route::get('/{any}', function () {
    return serveFrontend();
})->where('any', '.*');
