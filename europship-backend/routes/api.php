<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

Route::post('/auth/request-otp', [AuthController::class, 'loginOTP']);
Route::post('/auth/verify-otp', [AuthController::class, 'verifyOTP']);

// Routes JWT protégées
Route::middleware(['jwt.auth'])->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
});
