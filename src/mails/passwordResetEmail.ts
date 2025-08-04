import nodemailer from 'nodemailer';
import { MailerService } from '@/config/mailer';

declare module '@/config/mailer' {
  interface MailerService {
    sendPasswordResetEmail(
      to: string,
      resetToken: string,
      resetUrl: string
    ): Promise<nodemailer.SentMessageInfo>;
  }
}

/**
 * Send a password reset email
 */
MailerService.prototype.sendPasswordResetEmail = async function (
  to: string,
  resetToken: string,
  resetUrl: string
): Promise<nodemailer.SentMessageInfo> {
  const subject = 'Password Reset Request';
  const text = `You have requested a password reset. Please use the following link to reset your password: ${resetUrl}?token=${resetToken}\n\nIf you did not request this, please ignore this email.`;
  const html = `
    <h2>Password Reset Request</h2>
    <p>You have requested a password reset. Please click the link below to reset your password:</p>
    <p><a href="${resetUrl}?token=${resetToken}">Reset Password</a></p>
    <p>If you did not request this, please ignore this email.</p>
    <p><small>This link will expire in 1 hour.</small></p>
  `;

  return this.sendMail({ to, subject, text, html });
};
