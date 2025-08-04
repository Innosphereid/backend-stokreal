import nodemailer from 'nodemailer';
import { MailerService } from '@/config/mailer';

declare module '@/config/mailer' {
  interface MailerService {
    sendVerificationEmail(
      to: string,
      verificationToken: string,
      verificationUrl: string
    ): Promise<nodemailer.SentMessageInfo>;
  }
}

/**
 * Send an email verification email
 */
MailerService.prototype.sendVerificationEmail = async function (
  to: string,
  verificationToken: string,
  verificationUrl: string
): Promise<nodemailer.SentMessageInfo> {
  const subject = 'Please Verify Your Email Address';
  const text = `Please verify your email address by clicking the following link: ${verificationUrl}?token=${verificationToken}`;
  const html = `
    <h2>Email Verification</h2>
    <p>Please verify your email address by clicking the link below:</p>
    <p><a href="${verificationUrl}?token=${verificationToken}">Verify Email</a></p>
    <p><small>This link will expire in 24 hours.</small></p>
  `;

  return this.sendMail({ to, subject, text, html });
};
