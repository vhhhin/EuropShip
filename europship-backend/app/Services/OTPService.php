<?php

namespace App\Services;

use App\Models\User;
use App\Models\OTP;
use App\Mail\SendOtpMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Mail\Exceptions\TransportException;
use Carbon\Carbon;
use Exception;
use Throwable;

class OTPService
{
    /**
     * Validate email configuration
     * Returns true if valid, false otherwise
     */
    private function validateMailConfig(): bool
    {
        $mailer = config('mail.default');
        if (empty($mailer)) {
            Log::error("OTPService: MAIL_MAILER is not set in .env");
            return false;
        }

        // For SMTP, check required credentials
        if ($mailer === 'smtp') {
            $host = config('mail.mailers.smtp.host');
            $port = config('mail.mailers.smtp.port');
            $username = config('mail.mailers.smtp.username');
            $password = config('mail.mailers.smtp.password');

            if (empty($host)) {
                Log::error("OTPService: MAIL_HOST is not set in .env");
                return false;
            }

            if (empty($port)) {
                Log::error("OTPService: MAIL_PORT is not set in .env");
                return false;
            }

            // Username and password are required for authenticated SMTP
            if (empty($username)) {
                Log::error("OTPService: MAIL_USERNAME is not set in .env (required for SMTP)");
                return false;
            }

            if (empty($password)) {
                Log::error("OTPService: MAIL_PASSWORD is not set in .env (required for SMTP)");
                return false;
            }

            Log::info("OTPService: SMTP configuration validated - Host: {$host}, Port: {$port}");
        }

        // Check from address
        $fromAddress = config('mail.from.address');
        if (empty($fromAddress)) {
            Log::error("OTPService: MAIL_FROM_ADDRESS is not set in .env");
            return false;
        }

        Log::info("OTPService: Mail configuration validated - Mailer: {$mailer}, From: {$fromAddress}");
        return true;
    }

    /**
     * Generate and store OTP for user
     * Returns OTP code on success, null on failure
     */
    public function generateAndStoreOTP(User $user): ?string
    {
        try {
            Log::info("OTPService: OTP generation started for user {$user->email} (ID: {$user->id})");
            
            $otp = str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
            $hash = Hash::make($otp);
            $expiresAt = Carbon::now()->addMinutes(5);

            OTP::create([
                'user_id' => $user->id,
                'code_hash' => $hash,
                'expires_at' => $expiresAt,
            ]);

            Log::info("OTPService: OTP stored successfully for user {$user->email} - Code: {$otp}");
            
            return $otp;
        } catch (Exception $e) {
            Log::error("OTPService: Failed to generate/store OTP for user {$user->email}");
            Log::error("OTPService: Error message: " . $e->getMessage());
            Log::error("OTPService: Stack trace: " . $e->getTraceAsString());
            return null;
        }
    }

    /**
     * Send OTP email to user
     * Returns true ONLY if email was actually sent
     * Returns false if email failed or config is invalid
     * NEVER throws exceptions
     */
    public function sendOTP(User $user, string $otp): bool
    {
        try {
            Log::info("OTPService: Sending OTP email to {$user->email}");

            // Step 1: Validate mail configuration
            if (!$this->validateMailConfig()) {
                Log::error("OTPService: Mail configuration validation failed - cannot send email to {$user->email}");
                return false;
            }

            // Step 2: Create Mailable instance
            try {
                $mailable = new SendOtpMail($otp, $user->email);
                Log::info("OTPService: Mailable instance created for {$user->email}");
            } catch (Exception $e) {
                Log::error("OTPService: Failed to create Mailable instance for {$user->email}");
                Log::error("OTPService: Error: " . $e->getMessage());
                return false;
            }

            // Step 3: Send email - catch ALL possible exceptions
            try {
                Log::info("OTPService: Attempting to send email via Mail facade to {$user->email}");
                
                // Send email and catch any exceptions
                Mail::to($user->email)->send($mailable);
                
                // Check for failures (if method exists)
                try {
                    $failures = Mail::failures();
                    if (is_array($failures) && !empty($failures)) {
                        Log::error("OTPService: Mail send reported failures for {$user->email}");
                        Log::error("OTPService: Failed recipients: " . implode(', ', $failures));
                        return false;
                    }
                } catch (\Exception $failCheckEx) {
                    // Mail::failures() might not be available in all Laravel versions
                    // If it throws, we assume success (since no exception was thrown by send())
                    Log::debug("OTPService: Could not check Mail::failures() - assuming success");
                }

                // If we reach here, email was sent successfully
                Log::info("OTPService: OTP email sent successfully to {$user->email}");
                return true;

            } catch (TransportException $e) {
                Log::error("OTPService: Mail transport exception for {$user->email}");
                Log::error("OTPService: Transport error message: " . $e->getMessage());
                Log::error("OTPService: Transport error code: " . $e->getCode());
                if ($e->getPrevious()) {
                    Log::error("OTPService: Previous exception: " . $e->getPrevious()->getMessage());
                }
                return false;
            } catch (\Swift_TransportException $e) {
                Log::error("OTPService: Swift transport exception for {$user->email}");
                Log::error("OTPService: Swift error: " . $e->getMessage());
                return false;
            } catch (\Symfony\Component\Mailer\Exception\TransportExceptionInterface $e) {
                Log::error("OTPService: Symfony mailer transport exception for {$user->email}");
                Log::error("OTPService: Symfony error: " . $e->getMessage());
                return false;
            } catch (\ErrorException $e) {
                // Handle PHP errors (like "Trying to access array offset on value of type null")
                Log::error("OTPService: PHP error during mail sending for {$user->email}");
                Log::error("OTPService: Error message: " . $e->getMessage());
                Log::error("OTPService: Error file: " . $e->getFile() . ":" . $e->getLine());
                return false;
            } catch (Exception $e) {
                Log::error("OTPService: General mail exception for {$user->email}");
                Log::error("OTPService: Exception class: " . get_class($e));
                Log::error("OTPService: Exception message: " . $e->getMessage());
                Log::error("OTPService: Stack trace: " . $e->getTraceAsString());
                return false;
            } catch (Throwable $e) {
                Log::error("OTPService: Throwable in mail sending for {$user->email}");
                Log::error("OTPService: Throwable class: " . get_class($e));
                Log::error("OTPService: Throwable message: " . $e->getMessage());
                Log::error("OTPService: Stack trace: " . $e->getTraceAsString());
                return false;
            }

        } catch (Throwable $e) {
            // Ultimate fallback - should never reach here
            Log::error("OTPService: CRITICAL error in sendOTP for {$user->email}");
            Log::error("OTPService: Critical error class: " . get_class($e));
            Log::error("OTPService: Critical error message: " . $e->getMessage());
            Log::error("OTPService: Critical stack trace: " . $e->getTraceAsString());
            return false;
        }
    }

    /**
     * Verify OTP code for user
     * Returns true on success, false on failure
     * NEVER throws exceptions
     */
    public function verifyOTP(User $user, string $code): bool
    {
        try {
            Log::info("OTPService: Verifying OTP for user {$user->email}");
            
            $otp = OTP::where('user_id', $user->id)
                ->where('expires_at', '>', Carbon::now())
                ->orderByDesc('id')
                ->first();

            if (!$otp) {
                Log::warning("OTPService: No valid OTP found for user {$user->email}");
                return false;
            }

            if (Hash::check($code, $otp->code_hash)) {
                Log::info("OTPService: OTP verified successfully for user {$user->email}");
                // Mark OTP as used by deleting it
                try {
                    $otp->delete();
                } catch (Exception $e) {
                    Log::warning("OTPService: Failed to delete OTP after verification: " . $e->getMessage());
                    // Continue anyway - OTP is verified
                }
                return true;
            }

            Log::warning("OTPService: Invalid OTP code provided for user {$user->email}");
            return false;
        } catch (Exception $e) {
            Log::error("OTPService: Error verifying OTP for user {$user->email}");
            Log::error("OTPService: Error: " . $e->getMessage());
            return false;
        }
    }
}
