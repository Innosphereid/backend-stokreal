import { User } from '../types';
import { EmailService } from './EmailService';
import { logger } from '../utils/logger';

export class TierNotificationService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Send tier change notification
   */
  async sendTierChangeNotification(
    user: User,
    previous: string,
    next: string,
    reason: string
  ): Promise<boolean> {
    try {
      const result = await this.emailService.sendTierChangeEmail(user, previous, next, reason);
      logger.info(
        `Tier change notification sent to user ${user.id}: ${previous} -> ${next} (${reason})`
      );
      return result;
    } catch (error) {
      logger.error(`Failed to send tier change notification to user ${user.id}:`, error);
      return false;
    }
  }

  /**
   * Send expiration warning
   */
  async sendExpirationWarning(user: User, daysLeft: number): Promise<boolean> {
    try {
      const result = await this.emailService.sendExpirationWarningEmail(user, daysLeft);
      logger.info(`Expiration warning sent to user ${user.id} (${daysLeft} days left)`);
      return result;
    } catch (error) {
      logger.error(`Failed to send expiration warning to user ${user.id}:`, error);
      return false;
    }
  }

  /**
   * Send grace period notification
   */
  async sendGracePeriodNotification(user: User, gracePeriodEnd: Date): Promise<boolean> {
    try {
      const result = await this.emailService.sendGracePeriodEmail(user, gracePeriodEnd);
      logger.info(`Grace period notification sent to user ${user.id}`);
      return result;
    } catch (error) {
      logger.error(`Failed to send grace period notification to user ${user.id}:`, error);
      return false;
    }
  }

  /**
   * Send upgrade prompt
   */
  async sendUpgradePrompt(user: User, feature: string): Promise<boolean> {
    try {
      const result = await this.emailService.sendUpgradePromptEmail(user, feature);
      logger.info(`Upgrade prompt sent to user ${user.id} for feature ${feature}`);
      return result;
    } catch (error) {
      logger.error(`Failed to send upgrade prompt to user ${user.id}:`, error);
      return false;
    }
  }

  /**
   * Send in-app notification
   */
  async sendInAppNotification(userId: string, message: string): Promise<boolean> {
    try {
      // This would integrate with a real in-app notification system
      // For now, just log the notification
      logger.info(`In-app notification sent to user ${userId}: ${message}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send in-app notification to user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Send WhatsApp notification
   */
  async sendWhatsAppNotification(user: User, message: string): Promise<boolean> {
    try {
      // This would integrate with a real WhatsApp API
      // For now, just log the notification
      logger.info(`WhatsApp notification sent to user ${user.id}: ${message}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send WhatsApp notification to user ${user.id}:`, error);
      return false;
    }
  }
}
