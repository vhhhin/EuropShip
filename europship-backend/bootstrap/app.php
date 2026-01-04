<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'jwt.auth' => \App\Http\Middleware\JWTAuth::class,
        ]);
        
        // Enable CORS for API routes
        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Handle MethodNotAllowedHttpException for API routes
        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException $e, \Illuminate\Http\Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                $allowedMethods = [];
                try {
                    $headers = $e->getHeaders();
                    if (isset($headers['Allow'])) {
                        $allowedMethods = is_array($headers['Allow']) ? $headers['Allow'] : explode(', ', $headers['Allow']);
                    }
                } catch (\Exception $ex) {
                    // Fallback if headers can't be read
                }
                
                if (empty($allowedMethods)) {
                    $allowedMethods = ['POST']; // Default fallback
                }
                
                \Illuminate\Support\Facades\Log::warning("Method not allowed for API route: {$request->method()} on {$request->path()}. Allowed: " . implode(', ', $allowedMethods));
                
                return response()->json([
                    'success' => false,
                    'message' => 'Method not allowed. This endpoint only accepts ' . implode(', ', $allowedMethods) . ' requests.'
                ], 405);
            }
        });

        // Handle NotFoundHttpException for API routes
        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\NotFoundHttpException $e, \Illuminate\Http\Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Endpoint not found'
                ], 404);
            }
        });

        // Handle all other exceptions for API routes
        $exceptions->render(function (\Throwable $e, \Illuminate\Http\Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                \Illuminate\Support\Facades\Log::error('Unhandled API exception: ' . $e->getMessage());
                \Illuminate\Support\Facades\Log::error('Stack trace: ' . $e->getTraceAsString());
                
                return response()->json([
                    'success' => false,
                    'message' => config('app.debug') ? $e->getMessage() : 'An error occurred. Please try again later.'
                ], 500);
            }
        });
    })->create();
