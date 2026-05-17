<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\PublicController;
use App\Http\Controllers\Api\AuthController;

// Public Routes with SEO Support
Route::get('/salon/{id}', [PublicController::class, 'showSalonPublicPage']);
Route::get('/', [PublicController::class, 'renderFrontend']);

// Auth Routes
Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::get('/login-status', function() { 
    return response()->json(['status' => 'online']); 
});

// Fallback for SPA (Vite)
Route::get('/{any}', [PublicController::class, 'renderFrontend'])->where('any', '.*');
