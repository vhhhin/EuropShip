<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Queue\SerializesModels;

class SendOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public $otp;
    public $userEmail;

    /**
     * Create a new message instance.
     */
    public function __construct(string $otp, string $userEmail)
    {
        $this->otp = $otp;
        $this->userEmail = $userEmail;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $fromAddress = config('mail.from.address', 'europship.auth@gmail.com');
        $fromName = config('mail.from.name', 'EuroShip');
        
        return new Envelope(
            from: new Address($fromAddress, $fromName),
            subject: 'Your EuroShip OTP Code',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            text: 'emails.otp',
            with: [
                'otp' => $this->otp,
                'userEmail' => $this->userEmail,
            ],
        );
    }
}
