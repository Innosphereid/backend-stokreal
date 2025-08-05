import nodemailer from 'nodemailer';
import { MailerService } from '@/config/mailer';

declare module '@/config/mailer' {
  interface MailerService {
    sendPasswordResetConfirmationEmail(
      to: string,
      userName: string
    ): Promise<nodemailer.SentMessageInfo>;
  }
}

/**
 * Send a password reset confirmation email
 */
MailerService.prototype.sendPasswordResetConfirmationEmail = async function (
  to: string,
  userName: string
): Promise<nodemailer.SentMessageInfo> {
  const subject = 'Your StokReal Password Has Been Reset';
  const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`;

  const text = `Hello ${userName},

Your StokReal account password has been successfully reset.

You can now login to your account using your new password at:
${loginUrl}

If you did not perform this password reset, please contact our support team immediately as your account may have been compromised.

For security reasons, we recommend:
- Using a strong, unique password
- Enabling two-factor authentication if available
- Regularly updating your password

Best regards,
The StokReal Team`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Confirmation</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #059669; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9fafb; }
        .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        .security { background: #dbeafe; border: 1px solid #3b82f6; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Confirmation</h1>
        </div>
        <div class="content">
          <h2>Hello ${userName},</h2>
          <p>Your StokReal account password has been successfully reset.</p>
          <div style="text-align: center;">
            <a href="${loginUrl}" class="button">Login to Your Account</a>
          </div>
          <div class="security">
            <h3>Security Recommendations:</h3>
            <ul>
              <li>Use a strong, unique password</li>
              <li>Enable two-factor authentication if available</li>
              <li>Regularly update your password</li>
              <li>Never share your login credentials</li>
            </ul>
          </div>
          <div class="warning">
            <strong>Important:</strong> If you did not perform this password reset, please contact our support team immediately as your account may have been compromised.
          </div>
          <p>If you have any questions or concerns, please don't hesitate to contact our support team.</p>
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
