<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'app' => 'Sistem Administrasi RT API',
        'status' => 'Active',
        'version' => '1.0'
    ]);
});
