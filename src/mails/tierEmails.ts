import nodemailer from 'nodemailer';
import { MailerService, mailer } from '@/config/mailer';

declare module '@/config/mailer' {
  interface MailerService {
    sendTierChangeEmail(
      to: string,
      recipientName: string | undefined,
      previous: string,
      next: string,
      reason: string
    ): Promise<nodemailer.SentMessageInfo>;

    sendExpirationWarningEmail(
      to: string,
      recipientName: string | undefined,
      daysLeft: number
    ): Promise<nodemailer.SentMessageInfo>;

    sendGracePeriodEmail(
      to: string,
      recipientName: string | undefined,
      gracePeriodEnd: Date
    ): Promise<nodemailer.SentMessageInfo>;

    sendTierUpgradePromptEmail(
      to: string,
      recipientName: string | undefined,
      feature: string
    ): Promise<nodemailer.SentMessageInfo>;
  }
}

MailerService.prototype.sendTierChangeEmail = async function (
  to: string,
  recipientName: string | undefined,
  previous: string,
  next: string,
  reason: string
) {
  const subject = 'Your subscription tier has changed';
  const name = recipientName || to;
  const text = `Hello ${name},\n\nYour subscription tier changed from ${previous} to ${next} due to ${reason}.\n\nRegards,\nStokReal`;
  const html = `
    <p>Hello ${name},</p>
    <p>Your subscription tier changed from <strong>${previous}</strong> to <strong>${next}</strong> due to <em>${reason}</em>.</p>
    <p>Regards,<br/>StokReal</p>
  `;
  return this.sendMail({ to, subject, text, html });
};

MailerService.prototype.sendExpirationWarningEmail = async function (
  to: string,
  recipientName: string | undefined,
  daysLeft: number
) {
  const subject = 'Your subscription is expiring soon';
  const name = recipientName || to;
  const text = `Hello ${name},\n\nYour premium subscription will expire in ${daysLeft} day(s). Please renew to avoid interruption.\n\nRegards,\nStokReal`;
  const html = `
    <p>Hello ${name},</p>
    <p>Your premium subscription will expire in <strong>${daysLeft}</strong> day(s). Please renew to avoid interruption.</p>
    <p>Regards,<br/>StokReal</p>
  `;
  return this.sendMail({ to, subject, text, html });
};

MailerService.prototype.sendGracePeriodEmail = async function (
  to: string,
  recipientName: string | undefined,
  gracePeriodEnd: Date
) {
  const subject = 'Grace period activated for your subscription';
  const name = recipientName || to;
  const text = `Hello ${name},\n\nYour subscription has expired. A 7-day grace period is active until ${gracePeriodEnd.toISOString()}. Please renew to keep premium features.\n\nRegards,\nStokReal`;
  const html = `
    <p>Hello ${name},</p>
    <p>Your subscription has expired. A 7-day grace period is active until <strong>${gracePeriodEnd.toISOString()}</strong>. Please renew to keep premium features.</p>
    <p>Regards,<br/>StokReal</p>
  `;
  return this.sendMail({ to, subject, text, html });
};

MailerService.prototype.sendTierUpgradePromptEmail = async function (
  to: string,
  recipientName: string | undefined,
  feature: string
) {
  const subject = 'Unlock more with Premium';
  const name = recipientName || to;
  const text = `Hello ${name},\n\nUpgrade to Premium to unlock ${feature}.\n\nRegards,\nStokReal`;
  const html = `
    <p>Hello ${name},</p>
    <p>Upgrade to Premium to unlock <strong>${feature}</strong>.</p>
    <p>Regards,<br/>StokReal</p>
  `;
  return this.sendMail({ to, subject, text, html });
};

// Ensure the module executes and augments at import time
// Force module evaluation to ensure prototype augmentation side-effects
export const _tierEmailsInitialized = mailer;
