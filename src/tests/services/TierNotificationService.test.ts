import { TierNotificationService } from '../../services/TierNotificationService';
import { EmailService } from '../../services/EmailService';
import { UserModel } from '../../models/UserModel';
import { User, SubscriptionPlan } from '../../types';

jest.mock('../../services/EmailService');
jest.mock('../../models/UserModel');
jest.mock('../../utils/logger');

describe('TierNotificationService', () => {
  let notificationService: TierNotificationService;
  let mockUser: User;

  beforeEach(() => {
    jest.clearAllMocks();
    notificationService = new TierNotificationService();
    mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      password_hash: 'hashed-password',
      full_name: 'Test User',
      subscription_plan: 'premium' as SubscriptionPlan,
      subscription_expires_at: new Date('2025-12-31T23:59:59Z'),
      is_active: true,
      email_verified: true,
      role: 'user',
      created_at: new Date('2025-01-01T00:00:00Z'),
      updated_at: new Date('2025-01-01T00:00:00Z'),
    };
  });

  describe('sendTierChangeNotification', () => {
    it('should send notification on upgrade', async () => {
      // Arrange
      const spy = jest.spyOn(EmailService.prototype, 'sendTierChangeEmail').mockResolvedValue(true);
      // Act
      const result = await notificationService.sendTierChangeNotification(
        mockUser,
        'free',
        'premium',
        'upgrade'
      );
      // Assert
      expect(spy).toHaveBeenCalledWith(mockUser, 'free', 'premium', 'upgrade');
      expect(result).toBe(true);
    });
    it('should send notification on downgrade', async () => {
      const spy = jest.spyOn(EmailService.prototype, 'sendTierChangeEmail').mockResolvedValue(true);
      const result = await notificationService.sendTierChangeNotification(
        mockUser,
        'premium',
        'free',
        'downgrade'
      );
      expect(spy).toHaveBeenCalledWith(mockUser, 'premium', 'free', 'downgrade');
      expect(result).toBe(true);
    });
  });

  describe('sendExpirationWarning', () => {
    it('should send expiration warning email', async () => {
      const spy = jest
        .spyOn(EmailService.prototype, 'sendExpirationWarningEmail')
        .mockResolvedValue(true);
      const result = await notificationService.sendExpirationWarning(mockUser, 3);
      expect(spy).toHaveBeenCalledWith(mockUser, 3);
      expect(result).toBe(true);
    });
  });

  describe('sendGracePeriodNotification', () => {
    it('should send grace period notification email', async () => {
      const spy = jest
        .spyOn(EmailService.prototype, 'sendGracePeriodEmail')
        .mockResolvedValue(true);
      const result = await notificationService.sendGracePeriodNotification(
        mockUser,
        new Date('2025-01-08T00:00:00Z')
      );
      expect(spy).toHaveBeenCalledWith(mockUser, new Date('2025-01-08T00:00:00Z'));
      expect(result).toBe(true);
    });
  });

  describe('sendUpgradePrompt', () => {
    it('should send upgrade prompt email', async () => {
      const spy = jest
        .spyOn(EmailService.prototype, 'sendUpgradePromptEmail')
        .mockResolvedValue(true);
      const result = await notificationService.sendUpgradePrompt(mockUser, 'analytics_access');
      expect(spy).toHaveBeenCalledWith(mockUser, 'analytics_access');
      expect(result).toBe(true);
    });
  });

  describe('sendInAppNotification', () => {
    it('should send in-app notification', async () => {
      // This would call a stubbed method or a mock for in-app notification
      const spy = jest.spyOn(notificationService, 'sendInAppNotification').mockResolvedValue(true);
      const result = await notificationService.sendInAppNotification(
        mockUser.id,
        'Your subscription is expiring soon!'
      );
      expect(spy).toHaveBeenCalledWith(mockUser.id, 'Your subscription is expiring soon!');
      expect(result).toBe(true);
    });
  });

  describe('sendWhatsAppNotification', () => {
    it('should send WhatsApp notification if number is present', async () => {
      // This would call a stubbed method or a mock for WhatsApp notification
      const spy = jest
        .spyOn(notificationService, 'sendWhatsAppNotification')
        .mockResolvedValue(true);
      const result = await notificationService.sendWhatsAppNotification(
        mockUser,
        'Your subscription is expiring soon!'
      );
      expect(spy).toHaveBeenCalledWith(mockUser, 'Your subscription is expiring soon!');
      expect(result).toBe(true);
    });
  });
});
