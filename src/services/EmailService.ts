import { User } from '../types';

export class EmailService {
  async sendTierChangeEmail(user: User, previous: string, next: string, reason: string): Promise<boolean> {
    throw new Error('Not implemented');
  }
  async sendExpirationWarningEmail(user: User, daysLeft: number): Promise<boolean> {
    throw new Error('Not implemented');
  }
  async sendGracePeriodEmail(user: User, gracePeriodEnd: Date): Promise<boolean> {
    throw new Error('Not implemented');
  }
  async sendUpgradePromptEmail(user: User, feature: string): Promise<boolean> {
    throw new Error('Not implemented');
  }
}
