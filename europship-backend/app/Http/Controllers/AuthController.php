<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\LoginLog;
use App\Services\OTPService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Firebase\JWT\JWT;
use Carbon\Carbon;
use Exception;
use Throwable;

class AuthController extends Controller
{
    protected $otpService;
    protected $maxAttempts = 5;

    public function __construct(OTPService $otpService)
    {
        $this->otpService = $otpService;
    }

    /**
     * Request OTP for login
     */
    public function loginOTP(Request $request)
    {
        try {
            // Debug logs - vérifier méthode HTTP et données reçues
            Log::info("AuthController: loginOTP called");
            Log::info("AuthController: HTTP Method: " . $request->method());
            Log::info("AuthController: Request data: " . json_encode($request->all()));
            Log::info("AuthController: Request headers: " . json_encode($request->headers->all()));
            
            $request->validate([
                'email' => 'required|email|max:255'
            ]);

            $email = trim($request->input('email'));

            // Find user
            $user = User::where('email', $email)->first();
            if (!$user || $user->status !== 'active') {
                Log::warning("AuthController: Unauthorized user attempt: {$email}");
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized email address'
                ], 403);
            }

            Log::info("AuthController: User found - ID: {$user->id}, Role: {$user->role}");

            // Rate limiting
            $cacheKey = 'otp_attempts:' . $user->id;
            $attempts = Cache::get($cacheKey, 0);
            if ($attempts >= $this->maxAttempts) {
                Log::warning("AuthController: Rate limit exceeded for user {$email} (attempts: {$attempts})");
                return response()->json([
                    'success' => false,
                    'message' => 'Too many OTP requests. Please try again later.'
                ], 429);
            }

            // Generate OTP
            Log::info("AuthController: Generating OTP for user {$email}");
            $otp = $this->otpService->generateAndStoreOTP($user);
            if (!$otp) {
                Log::error("AuthController: Failed to generate OTP for user {$email}");
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to generate OTP. Please try again.'
                ], 500);
            }

            Log::info("AuthController: OTP generated successfully for user {$email}");

            // Send OTP email using OTPService
            Log::info("AuthController: Attempting to send OTP email to {$user->email}");
            $emailSent = $this->otpService->sendOTP($user, $otp);
            Log::info("AuthController: Email send result: " . ($emailSent ? 'SUCCESS' : 'FAILED'));

            // Log attempt
            try {
                LoginLog::create([
                    'user_id' => $user->id,
                    'role' => $user->role,
                    'otp_generated_at' => now(),
                    'success' => $emailSent ? null : false,
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent() ?? 'Unknown',
                ]);
            } catch (Exception $e) {
                Log::error("AuthController: Failed to create login log: " . $e->getMessage());
            }

            // Update rate limit
            Cache::put($cacheKey, $attempts + 1, now()->addMinutes(5));

            // Return response - mode debug returns OTP if email failed
            if ($emailSent) {
                Log::info("AuthController: OTP request completed successfully - email sent to {$user->email}");
                return response()->json([
                    'success' => true,
                    'message' => 'OTP has been sent to your email.'
                ], 200);
            } else {
                Log::error("AuthController: OTP generated but email FAILED for user {$user->email}");
                
                // Debug mode: return OTP in response if email failed
                if (config('app.debug')) {
                    Log::info("AuthController: DEBUG MODE - Returning OTP in response (email failed)");
                    return response()->json([
                        'success' => false,
                        'message' => 'OTP email could not be sent. Check mail configuration.',
                        'debug_otp' => $otp,
                        'debug_note' => 'Email sending failed. Check logs for details.'
                    ], 500);
                }
                
                // Production: don't expose OTP
                return response()->json([
                    'success' => false,
                    'message' => 'OTP email could not be sent. Check mail configuration.'
                ], 500);
            }

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning("AuthController: Validation failed - " . json_encode($e->errors()));
            return response()->json([
                'success' => false,
                'message' => 'Invalid email address'
            ], 422);
        } catch (Throwable $e) {
            Log::error("AuthController: Critical error in loginOTP: " . $e->getMessage());
            Log::error("AuthController: Stack trace: " . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'OTP service unavailable. Contact support.'
            ], 500);
        }
    }

    /**
     * Verify OTP and generate JWT token
     */
    public function verifyOTP(Request $request)
    {
        try {
            // Debug logs - vérifier méthode HTTP et données reçues
            Log::info("AuthController: verifyOTP called");
            Log::info("AuthController: HTTP Method: " . $request->method());
            Log::info("AuthController: Request data: " . json_encode($request->all()));
            
            $request->validate([
                'email' => 'required|email|max:255',
                'otp' => 'required|string|size:6',
            ]);

            $email = trim($request->input('email'));
            $otpCode = trim($request->input('otp'));

            Log::info("AuthController: Verifying OTP for email: {$email}");

            $user = User::where('email', $email)->first();
            if (!$user || $user->status !== 'active') {
                Log::warning("AuthController: Unauthorized OTP verification attempt: {$email}");
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized email address'
                ], 403);
            }

            // Verify OTP
            Log::info("AuthController: Verifying OTP code for user {$email}");
            $success = $this->otpService->verifyOTP($user, $otpCode);
            if (!$success) {
                Log::warning("AuthController: OTP verification failed for user {$email}");
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid or expired OTP.'
                ], 401);
            }

            Log::info("AuthController: OTP verified successfully for user {$email}");

            // Generate JWT
            $jwtSecret = env('JWT_SECRET');
            if (empty($jwtSecret)) {
                Log::error("AuthController: JWT_SECRET is not configured");
                return response()->json([
                    'success' => false,
                    'message' => 'Server configuration error'
                ], 500);
            }
            
            try {
                $payload = [
                    'sub' => $user->id,
                    'role' => $user->role,
                    'exp' => Carbon::now()->addHours(8)->timestamp,
                    'iat' => Carbon::now()->timestamp,
                ];
                $token = JWT::encode($payload, $jwtSecret, 'HS256');
                Log::info("AuthController: JWT token generated successfully for user {$user->email}");
            } catch (Exception $e) {
                Log::error("AuthController: Failed to generate JWT: " . $e->getMessage());
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to generate authentication token'
                ], 500);
            }

            // Log successful verification
            try {
                LoginLog::create([
                    'user_id' => $user->id,
                    'role' => $user->role,
                    'otp_verified_at' => now(),
                    'success' => true,
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent() ?? 'Unknown',
                ]);
            } catch (Exception $e) {
                Log::error("AuthController: Failed to create login log: " . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'role' => strtoupper($user->role),
                    'displayName' => $user->role === 'admin' ? 'EuropShip Admin' : 'EuropShip Agent',
                ],
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning("AuthController: Validation failed in verifyOTP - " . json_encode($e->errors()));
            return response()->json([
                'success' => false,
                'message' => 'Invalid input data'
            ], 422);
        } catch (Throwable $e) {
            Log::error("AuthController: Critical error in verifyOTP: " . $e->getMessage());
            Log::error("AuthController: Stack trace: " . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'OTP verification service unavailable.'
            ], 500);
        }
    }

    /**
     * Get current authenticated user
     */
    public function me(Request $request)
    {
        try {
            Log::info("AuthController: me called");
            Log::info("AuthController: HTTP Method: " . $request->method());
            
            $user = $request->user();
            if (!$user) {
                Log::warning("AuthController: Unauthorized access to /auth/me");
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 401);
            }
            
            Log::info("AuthController: User retrieved - ID: {$user->id}, Email: {$user->email}");
            
            return response()->json([
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'role' => strtoupper($user->role),
                    'displayName' => $user->role === 'admin' ? 'EuropShip Admin' : 'EuropShip Agent',
                ],
            ], 200);
        } catch (Exception $e) {
            Log::error("AuthController: Error in me endpoint: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'An error occurred'
            ], 500);
        }
    }

    /**
     * Logout user
     */
    public function logout(Request $request)
    {
        try {
            Log::info("AuthController: logout called");
            Log::info("AuthController: HTTP Method: " . $request->method());
            
            return response()->json([
                'success' => true,
                'message' => 'Logged out successfully.'
            ], 200);
        } catch (Exception $e) {
            Log::error("AuthController: Error in logout endpoint: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'An error occurred'
            ], 500);
        }
    }
}
