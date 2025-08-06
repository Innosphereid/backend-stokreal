import nodemailer from 'nodemailer';
import { MailerService } from '@/config/mailer';

declare module '@/config/mailer' {
  interface MailerService {
    sendPasswordResetEmail(
      to: string,
      userName: string,
      resetToken: string
    ): Promise<nodemailer.SentMessageInfo>;
  }
}

/**
 * Send a password reset email
 */
MailerService.prototype.sendPasswordResetEmail = async function (
  to: string,
  userName: string,
  resetToken: string
): Promise<nodemailer.SentMessageInfo> {
  const subject = 'Reset Your StokReal Password';
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password`;
  const resetLink = `${resetUrl}?token=${resetToken}`;

  const text = `Hello ${userName},

You have requested to reset your password for your StokReal account.

Please click the following link to reset your password:
${resetLink}

This link will expire in 1 hour for security reasons.

If you did not request this password reset, please ignore this email and your password will remain unchanged.

Best regards,
The StokReal Team`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
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
          <h1>Reset Your Password</h1>
        </div>
        <div class="content">
          <h2>Hello ${userName},</h2>
          <p>You have requested to reset your password for your StokReal account.</p>
          <p>Please click the button below to reset your password:</p>
          <div style="text-align: center;">
            <a href="${resetLink}" class="button">Reset Password</a>
          </div>
          <div class="warning">
            <strong>Security Notice:</strong> This link will expire in 1 hour for security reasons.
          </div>
          <p>If you did not request this password reset, please ignore this email and your password will remain unchanged.</p>
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
