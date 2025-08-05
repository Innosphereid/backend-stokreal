import nodemailer from 'nodemailer';
import { MailerService } from '@/config/mailer';

declare module '@/config/mailer' {
  interface MailerService {
    sendWelcomeEmail(
      to: string,
      userName: string,
      verificationToken?: string
    ): Promise<nodemailer.SentMessageInfo>;
  }
}

/**
 * Send a welcome email with optional verification token
 */
MailerService.prototype.sendWelcomeEmail = async function (
  to: string,
  userName: string,
  verificationToken?: string
): Promise<nodemailer.SentMessageInfo> {
  const subject = 'Welcome to StokReal - Your Inventory Management Solution!';

  const verificationLink = verificationToken
    ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`
    : '';

  const text = `Hello ${userName},

Welcome to StokReal! We're excited to have you on board.

Your account has been successfully created. You can now access our inventory management system to:
- Track your products and stock levels
- Manage sales and purchases
- Generate reports and analytics
- Collaborate with your team

${
  verificationToken
    ? `To complete your registration, please verify your email address by clicking the link below:
${verificationLink}

This link will expire in 24 hours.`
    : ''
}

If you have any questions or need assistance, please don't hesitate to contact our support team.

Best regards,
The StokReal Team`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to StokReal</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; background: #f9fafb; }
        .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
        .features { margin: 20px 0; }
        .feature { margin: 10px 0; padding: 10px; background: white; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to StokReal!</h1>
          <p>Your Inventory Management Solution</p>
        </div>
        
        <div class="content">
          <h2>Hello ${userName},</h2>
          
          <p>Welcome to StokReal! We're excited to have you on board.</p>
          
          <p>Your account has been successfully created. You can now access our inventory management system to:</p>
          
          <div class="features">
            <div class="feature">📦 Track your products and stock levels</div>
            <div class="feature">💰 Manage sales and purchases</div>
            <div class="feature">📊 Generate reports and analytics</div>
            <div class="feature">👥 Collaborate with your team</div>
          </div>
          
          ${
            verificationToken
              ? `
          <p><strong>Important:</strong> To complete your registration, please verify your email address by clicking the button below:</p>
          
          <div style="text-align: center;">
            <a href="${verificationLink}" class="button">Verify Email Address</a>
          </div>
          
          <p style="font-size: 14px; color: #6b7280;">
            This link will expire in 24 hours. If you didn't create this account, you can safely ignore this email.
          </p>
          `
              : ''
          }
          
          <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          
          <p>Best regards,<br>The StokReal Team</p>
        </div>
        
        <div class="footer">
          <p>© 2024 StokReal. All rights reserved.</p>
          <p>This email was sent to ${to}</p>
        </div>
      </div>
    </body>
    </html>`;

  return this.sendMail({ to, subject, text, html });
};
