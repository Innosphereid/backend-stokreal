import nodemailer from 'nodemailer';
import { MailerService } from '@/config/mailer';

declare module '@/config/mailer' {
  interface MailerService {
    sendWelcomeEmail(to: string, userName: string): Promise<nodemailer.SentMessageInfo>;
  }
}

/**
 * Send a welcome email
 */
MailerService.prototype.sendWelcomeEmail = async function (
  to: string,
  userName: string
): Promise<nodemailer.SentMessageInfo> {
  const subject = 'Welcome to Our Platform!';
  const text = `Hello ${userName},\n\nWelcome to our platform! We're excited to have you on board.\n\nBest regards,\nThe Team`;
  const html = `
    <h1>Welcome ${userName}!</h1>
    <p>Welcome to our platform! We're excited to have you on board.</p>
    <p>Best regards,<br>The Team</p>
  `;

  return this.sendMail({ to, subject, text, html });
};
