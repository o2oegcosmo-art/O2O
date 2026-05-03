<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// الحل القاتل: دعم الـ POST والـ GET في مسار الـ Web وتوجيهه للمحرك الصحيح
Route::match(['get', 'post'], '/login', [\App\Http\Controllers\Api\AuthController::class, 'login'])->name('login');

// مسار احتياطي للـ GET فقط لإظهار رسالة واضحة
Route::get('/login-status', function() {
    return response()->json(['status' => 'online', 'message' => 'Login system is active.']);
});
