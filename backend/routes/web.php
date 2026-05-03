<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return file_get_contents(public_path('index.html'));
});

// الحل القاتل: دعم الـ POST والـ GET في مسار الـ Web وتوجيهه للمحرك الصحيح
Route::match(['get', 'post'], '/login', [\App\Http\Controllers\Api\AuthController::class, 'login'])->name('login');

// مسار احتياطي للـ GET فقط لإظهار رسالة واضحة
Route::get('/login-status', function() {
    return response()->json(['status' => 'online', 'message' => 'Login system is active.']);
});

// Catch-all route to serve React application for any unmatched routes
Route::get('/{any}', function () {
    return file_get_contents(public_path('index.html'));
})->where('any', '.*');
