<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $payload = $request->attributes->get('jwt_payload');
        if (!$payload || !in_array($payload['role'], $roles)) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }
        return $next($request);
    }
}
