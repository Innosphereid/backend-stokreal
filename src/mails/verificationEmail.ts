import nodemailer from 'nodemailer';
import { MailerService } from '@/config/mailer';

declare module '@/config/mailer' {
  interface MailerService {
    sendVerificationEmail(
      to: string,
      userName: string,
      verificationToken: string
    ): Promise<nodemailer.SentMessageInfo>;
  }
}

/**
 * Send an email verification email
 */
MailerService.prototype.sendVerificationEmail = async function (
  to: string,
  userName: string,
  verificationToken: string
): Promise<nodemailer.SentMessageInfo> {
  const subject = 'Verify Your StokReal Email Address';
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email`;
  const verificationLink = `${verificationUrl}?token=${verificationToken}`;

  const text = `Hello ${userName},

Welcome to StokReal! Please verify your email address to complete your registration.

Click the following link to verify your email:
${verificationLink}

This link will expire in 24 hours for security reasons.

If you did not create this account, please ignore this email.

Best regards,
The StokReal Team`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9fafb; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Verify Your Email</h1>
        </div>
        <div class="content">
          <h2>Hello ${userName},</h2>
          <p>Welcome to StokReal! Please verify your email address to complete your registration.</p>
          <div style="text-align: center;">
            <a href="${verificationLink}" class="button">Verify Email Address</a>
          </div>
          <div class="warning">
            <strong>Security Notice:</strong> This link will expire in 24 hours for security reasons.
          </div>
          <p>If you did not create this account, please ignore this email.</p>
          <p>If you have any questions, please contact our support team.</p>
        </div>
        <div class="footer">
          <p>Best regards,<br>The StokReal Team</p>
          <p><small>This is an automated email. Please do not reply to this message.</small></p>
        </div>
      </div>
    </body>
    </html>`;

  return this.sendMail({ to, subject, text, html });
};
