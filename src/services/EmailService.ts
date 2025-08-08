import { User } from '../types';
import { mailer } from '@/mails';
import { logger } from '@/utils/logger';

export class EmailService {
  async sendTierChangeEmail(
    user: User,
    previous: string,
    next: string,
    reason: string
  ): Promise<boolean> {
    try {
      await mailer.sendTierChangeEmail(user.email, user.full_name, previous, next, reason);
      return true;
    } catch (error) {
      logger.error('sendTierChangeEmail failed:', error);
      return false;
    }
  }

  async sendExpirationWarningEmail(user: User, daysLeft: number): Promise<boolean> {
    try {
      await mailer.sendExpirationWarningEmail(user.email, user.full_name, daysLeft);
      return true;
    } catch (error) {
      logger.error('sendExpirationWarningEmail failed:', error);
      return false;
    }
  }

  async sendGracePeriodEmail(user: User, gracePeriodEnd: Date): Promise<boolean> {
    try {
      await mailer.sendGracePeriodEmail(user.email, user.full_name, gracePeriodEnd);
      return true;
    } catch (error) {
      logger.error('sendGracePeriodEmail failed:', error);
      return false;
    }
  }

  async sendUpgradePromptEmail(user: User, feature: string): Promise<boolean> {
    try {
      await mailer.sendTierUpgradePromptEmail(user.email, user.full_name, feature);
      return true;
    } catch (error) {
      logger.error('sendUpgradePromptEmail failed:', error);
      return false;
    }
  }
}
