<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ResidentController;
use App\Http\Controllers\Api\HouseController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\ReportController;

// Public routes
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Residents
    Route::get('/residents', [ResidentController::class, 'index']);
    Route::post('/residents', [ResidentController::class, 'store']);
    Route::get('/residents/{id}', [ResidentController::class, 'show']);
    Route::put('/residents/{id}', [ResidentController::class, 'update']);
    Route::post('/residents/{id}/photo', [ResidentController::class, 'uploadPhoto']);
    Route::delete('/residents/{id}/photo', [ResidentController::class, 'deletePhoto']);
    Route::get('/residents/{id}/photo-view', [ResidentController::class, 'viewPhoto']);

    // Houses
    Route::get('/houses', [HouseController::class, 'index']);
    Route::post('/houses', [HouseController::class, 'store']);
    Route::get('/houses/{id}', [HouseController::class, 'show']);
    Route::put('/houses/{id}', [HouseController::class, 'update']);
    Route::post('/houses/{id}/assign-resident', [HouseController::class, 'assignResident']);
    Route::put('/houses/{id}/remove-resident/{residentId}', [HouseController::class, 'removeResident']);
    Route::get('/houses/{id}/history', [HouseController::class, 'history']);
    Route::get('/houses/{id}/payment-history', [HouseController::class, 'paymentHistory']);

    // Payments
    Route::get('/payments', [PaymentController::class, 'index']);
    Route::post('/payments', [PaymentController::class, 'store']);
    Route::get('/payments/{id}', [PaymentController::class, 'show'])->where('id', '[0-9]+');
    Route::get('/payments/status', [PaymentController::class, 'status']);
    Route::put('/payments/{id}', [PaymentController::class, 'update']);
    Route::delete('/payments/{id}', [PaymentController::class, 'destroy']);

    // Expenses
    Route::get('/expenses', [ExpenseController::class, 'index']);
    Route::post('/expenses', [ExpenseController::class, 'store']);
    Route::get('/expenses/{id}', [ExpenseController::class, 'show']);
    Route::put('/expenses/{id}', [ExpenseController::class, 'update']);
    Route::delete('/expenses/{id}', [ExpenseController::class, 'destroy']);

    // Reports
    Route::get('/reports/summary', [ReportController::class, 'summary']);
    Route::get('/reports/monthly/{year}/{month}', [ReportController::class, 'monthly']);
});
