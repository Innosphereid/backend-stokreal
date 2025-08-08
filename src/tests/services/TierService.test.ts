import { TierService } from '../../services/TierService';
import { UserModel } from '../../models/UserModel';
import { TierFeatureModel } from '../../models/TierFeatureModel';
import { TierHistoryModel } from '../../models/TierHistoryModel';
import { TierFeatureDefinitionsModel } from '../../models/TierFeatureDefinitionsModel';
import { User, SubscriptionPlan } from '../../types';

// Mock dependencies
jest.mock('../../models/UserModel');
jest.mock('../../models/TierFeatureModel');
jest.mock('../../models/TierHistoryModel');
jest.mock('../../models/TierFeatureDefinitionsModel');
jest.mock('../../utils/logger');

const mockUserModel = UserModel as jest.MockedClass<typeof UserModel>;
const mockTierFeatureModel = TierFeatureModel as jest.MockedClass<typeof TierFeatureModel>;
const mockTierHistoryModel = TierHistoryModel as jest.MockedClass<typeof TierHistoryModel>;
const mockTierFeatureDefinitionsModel = TierFeatureDefinitionsModel as jest.MockedClass<
  typeof TierFeatureDefinitionsModel
>;

describe('TierService', () => {
  let tierService: TierService;
  let mockUser: User;

  beforeEach(() => {
    jest.clearAllMocks();
    tierService = new TierService();

    mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      password_hash: 'hashed-password',
      full_name: 'Test User',
      subscription_plan: 'free' as SubscriptionPlan,
      subscription_expires_at: new Date('2025-12-31T23:59:59Z'),
      is_active: true,
      email_verified: true,
      role: 'user',
      created_at: new Date('2025-01-01T00:00:00Z'),
      updated_at: new Date('2025-01-01T00:00:00Z'),
    };
  });

  describe('getUserTierStatus', () => {
    it('should return tier status for active premium user', async () => {
      // Arrange
      const premiumUser = {
        ...mockUser,
        subscription_plan: 'premium' as SubscriptionPlan,
        subscription_expires_at: new Date('2025-12-31T23:59:59Z'),
      };

      mockUserModel.prototype.findById.mockResolvedValue(premiumUser);
      mockTierFeatureModel.prototype.getUserFeatureUsage.mockResolvedValue({
        max_products: { current: 25, limit: null },
        max_categories: { current: 10, limit: null },
        analytics_access: { current: 0, limit: null },
      });
      mockTierFeatureDefinitionsModel.prototype.findBy.mockResolvedValue([
        { feature_name: 'max_products', feature_limit: null, feature_enabled: true },
        { feature_name: 'analytics_access', feature_limit: null, feature_enabled: true },
      ]);

      // Act
      const result = await tierService.getUserTierStatus('user-123');

      // Assert
      expect(result).toEqual({
        user_id: 'user-123',
        subscription_plan: 'premium',
        subscription_expires_at: new Date('2025-12-31T23:59:59Z'),
        is_active: true,
        days_until_expiration: expect.any(Number),
        grace_period_active: false,
        grace_period_expires_at: null,
        tier_features: {
          max_products: 'unlimited',
          analytics_access: 'unlimited',
        },
        current_usage: {
          max_products: { current: 25, limit: null },
          max_categories: { current: 10, limit: null },
          analytics_access: { current: 0, limit: null },
        },
      });
    });

    it('should return tier status for free user with limits', async () => {
      // Arrange
      const freeUser = {
        ...mockUser,
        subscription_plan: 'free' as SubscriptionPlan,
        subscription_expires_at: undefined,
      };

      mockUserModel.prototype.findById.mockResolvedValue(freeUser);
      mockTierFeatureModel.prototype.getUserFeatureUsage.mockResolvedValue({
        max_products: { current: 35, limit: 50 },
        max_categories: { current: 15, limit: 20 },
        analytics_access: { current: 0, limit: null },
      });
      mockTierFeatureDefinitionsModel.prototype.findBy.mockResolvedValue([
        { feature_name: 'max_products', feature_limit: 50, feature_enabled: true },
        { feature_name: 'analytics_access', feature_limit: null, feature_enabled: false },
      ]);

      // Act
      const result = await tierService.getUserTierStatus('user-123');

      // Assert
      expect(result).toEqual({
        user_id: 'user-123',
        subscription_plan: 'free',
        subscription_expires_at: null,
        is_active: true,
        days_until_expiration: null,
        grace_period_active: false,
        grace_period_expires_at: null,
        tier_features: {
          max_products: 50,
          analytics_access: false,
        },
        current_usage: {
          max_products: { current: 35, limit: 50 },
          max_categories: { current: 15, limit: 20 },
          analytics_access: { current: 0, limit: null },
        },
      });
    });

    it('should handle expired premium user with grace period', async () => {
      // Arrange
      // Use a recent expiration date to ensure grace period is still active
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 3); // Expired 3 days ago

      const expiredPremiumUser = {
        ...mockUser,
        subscription_plan: 'premium' as SubscriptionPlan,
        subscription_expires_at: expiredDate,
      };

      mockUserModel.prototype.findById.mockResolvedValue(expiredPremiumUser);
      mockTierFeatureModel.prototype.getUserFeatureUsage.mockResolvedValue({
        max_products: { current: 25, limit: null },
        max_categories: { current: 10, limit: null },
      });
      mockTierFeatureDefinitionsModel.prototype.findBy.mockResolvedValue([
        { feature_name: 'max_products', feature_limit: null, feature_enabled: true },
      ]);

      // Act
      const result = await tierService.getUserTierStatus('user-123');

      // Assert
      expect(result.grace_period_active).toBe(true);
      expect(result.days_until_expiration).toBeLessThan(0);
    });

    it('should throw error for non-existent user', async () => {
      // Arrange
      mockUserModel.prototype.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(tierService.getUserTierStatus('non-existent')).rejects.toThrow('User not found');
    });
  });

  describe('checkSubscriptionExpiration', () => {
    it('should return false for active subscription', () => {
      // Arrange
      const activeSubscription = new Date('2025-12-31T23:59:59Z');

      // Act
      const result = tierService.checkSubscriptionExpiration(activeSubscription);

      // Assert
      expect(result).toBe(false);
    });

    it('should return true for expired subscription', () => {
      // Arrange
      const expiredSubscription = new Date('2025-01-01T00:00:00Z');

      // Act
      const result = tierService.checkSubscriptionExpiration(expiredSubscription);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for null subscription (free user)', () => {
      // Act
      const result = tierService.checkSubscriptionExpiration(null);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('calculateGracePeriod', () => {
    it('should calculate grace period end date correctly', () => {
      // Arrange
      const expirationDate = new Date('2025-01-01T00:00:00Z');
      const expectedGracePeriodEnd = new Date('2025-01-08T00:00:00Z');

      // Act
      const result = tierService.calculateGracePeriod(expirationDate);

      // Assert
      expect(result).toEqual(expectedGracePeriodEnd);
    });

    it('should return null for null expiration date', () => {
      // Act
      const result = tierService.calculateGracePeriod(null);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('isGracePeriodActive', () => {
    it('should return true for active grace period', () => {
      // Arrange
      const gracePeriodEnd = new Date('2025-12-31T23:59:59Z');

      // Act
      const result = tierService.isGracePeriodActive(gracePeriodEnd);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for expired grace period', () => {
      // Arrange
      const gracePeriodEnd = new Date('2025-01-01T00:00:00Z');

      // Act
      const result = tierService.isGracePeriodActive(gracePeriodEnd);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for null grace period', () => {
      // Act
      const result = tierService.isGracePeriodActive(null);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('performAutomaticDowngrade', () => {
    it('should downgrade expired premium user to free', async () => {
      // Arrange
      const expiredPremiumUser = {
        ...mockUser,
        subscription_plan: 'premium' as SubscriptionPlan,
        subscription_expires_at: new Date('2025-01-01T00:00:00Z'),
      };

      mockUserModel.prototype.findById.mockResolvedValue(expiredPremiumUser);
      mockUserModel.prototype.update.mockResolvedValue({
        ...expiredPremiumUser,
        subscription_plan: 'free',
      });
      mockTierHistoryModel.prototype.create.mockResolvedValue({
        id: 'history-123',
        user_id: 'user-123',
        previous_plan: 'premium',
        new_plan: 'free',
        change_reason: 'expiration',
        effective_date: expect.any(Date),
      });

      // Act
      const result = await tierService.performAutomaticDowngrade('user-123');

      // Assert
      expect(result).toBe(true);
      expect(mockUserModel.prototype.update).toHaveBeenCalledWith('user-123', {
        subscription_plan: 'free',
        subscription_expires_at: undefined,
      });
      expect(mockTierHistoryModel.prototype.create).toHaveBeenCalledWith({
        user_id: 'user-123',
        previous_plan: 'premium',
        new_plan: 'free',
        change_reason: 'expiration',
        effective_date: expect.any(Date),
      });
    });

    it('should not downgrade active premium user', async () => {
      // Arrange
      const activePremiumUser = {
        ...mockUser,
        subscription_plan: 'premium' as SubscriptionPlan,
        subscription_expires_at: new Date('2025-12-31T23:59:59Z'),
      };

      mockUserModel.prototype.findById.mockResolvedValue(activePremiumUser);

      // Act
      const result = await tierService.performAutomaticDowngrade('user-123');

      // Assert
      expect(result).toBe(false);
      expect(mockUserModel.prototype.update).not.toHaveBeenCalled();
    });

    it('should not downgrade free user', async () => {
      // Arrange
      const freeUser = {
        ...mockUser,
        subscription_plan: 'free' as SubscriptionPlan,
        subscription_expires_at: undefined,
      };

      mockUserModel.prototype.findById.mockResolvedValue(freeUser);

      // Act
      const result = await tierService.performAutomaticDowngrade('user-123');

      // Assert
      expect(result).toBe(false);
      expect(mockUserModel.prototype.update).not.toHaveBeenCalled();
    });
  });

  describe('recordTierChange', () => {
    it('should record tier change in history', async () => {
      // Arrange
      const tierChangeData = {
        user_id: 'user-123',
        previous_plan: 'free' as SubscriptionPlan,
        new_plan: 'premium' as SubscriptionPlan,
        change_reason: 'upgrade',
        changed_by: 'admin-456',
        notes: 'User upgraded to premium',
      };

      mockTierHistoryModel.prototype.create.mockResolvedValue({
        id: 'history-123',
        ...tierChangeData,
        effective_date: expect.any(Date),
        created_at: expect.any(Date),
      });

      // Act
      const result = await tierService.recordTierChange(tierChangeData);

      // Assert
      expect(result).toBeDefined();
      expect(mockTierHistoryModel.prototype.create).toHaveBeenCalledWith({
        ...tierChangeData,
        effective_date: expect.any(Date),
      });
    });
  });

  describe('getTierFeatures', () => {
    it('should return premium tier features', async () => {
      // Arrange
      const premiumFeatures = [
        { feature_name: 'max_products', feature_limit: null, feature_enabled: true },
        { feature_name: 'analytics_access', feature_limit: null, feature_enabled: true },
      ];

      mockTierFeatureDefinitionsModel.prototype.findBy.mockResolvedValue(premiumFeatures);

      // Act
      const result = await tierService.getTierFeatures('premium');

      // Assert
      expect(result).toEqual({
        max_products: 'unlimited',
        analytics_access: 'unlimited',
      });
    });

    it('should return free tier features with limits', async () => {
      // Arrange
      const freeFeatures = [
        { feature_name: 'max_products', feature_limit: 50, feature_enabled: true },
        { feature_name: 'analytics_access', feature_limit: null, feature_enabled: false },
      ];

      mockTierFeatureDefinitionsModel.prototype.findBy.mockResolvedValue(freeFeatures);

      // Act
      const result = await tierService.getTierFeatures('free');

      // Assert
      expect(result).toEqual({
        max_products: 50,
        analytics_access: false,
      });
    });
  });
});
