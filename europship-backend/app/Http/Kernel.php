<?php

namespace App\Http\Controllers;

abstract class Controller
{
    //
}

protected $routeMiddleware = [
    // ...existing code...
    'jwt.auth' => \App\Http\Middleware\JWTAuth::class,
    'role' => \App\Http\Middleware\RoleMiddleware::class,
];