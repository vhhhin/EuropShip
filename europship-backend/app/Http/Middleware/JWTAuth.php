<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class JWTAuth
{
    /**
     * Handle an incoming request.
     *
     * Vérifie le token JWT dans l'en-tête Authorization (Bearer).
     * Injecte le payload dans $request->attributes['jwt_payload'].
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        // Récupère l'en-tête Authorization
        $header = $request->header('Authorization');

        // Vérifie la présence du token
        if (!$header || !str_starts_with($header, 'Bearer ')) {
            return response()->json(['message' => 'Token manquant'], 401);
        }

        $token = substr($header, 7); // Supprime "Bearer "

        try {
            // Décode le JWT avec la clé secrète
            $payload = JWT::decode($token, new Key(env('JWT_SECRET'), 'HS256'));
            $payloadArray = (array)$payload;

            // Injecte le payload dans la requête pour que les controllers puissent l'utiliser
            $request->attributes->add(['jwt_payload' => $payloadArray]);
            
            // Charge l'utilisateur depuis la base de données et l'injecte dans la requête
            if (isset($payloadArray['sub'])) {
                $user = \App\Models\User::find($payloadArray['sub']);
                if ($user) {
                    $request->setUserResolver(function () use ($user) {
                        return $user;
                    });
                }
            }
        } catch (\Firebase\JWT\ExpiredException $e) {
            return response()->json(['message' => 'Token expiré'], 401);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Token invalide', 'error' => $e->getMessage()], 401);
        }

        return $next($request);
    }
}
