import { TierFeatureService } from '../../services/TierFeatureService';
import { TierFeatureModel } from '../../models/TierFeatureModel';
import { TierFeatureDefinitionsModel } from '../../models/TierFeatureDefinitionsModel';

// Mock dependencies
jest.mock('../../models/TierFeatureModel');
jest.mock('../../models/TierFeatureDefinitionsModel');
jest.mock('../../utils/logger');

const mockTierFeatureModel = TierFeatureModel as jest.MockedClass<typeof TierFeatureModel>;
const mockTierFeatureDefinitionsModel = TierFeatureDefinitionsModel as jest.MockedClass<
  typeof TierFeatureDefinitionsModel
>;

describe('TierFeatureService', () => {
  let tierFeatureService: TierFeatureService;

  beforeEach(() => {
    jest.clearAllMocks();
    tierFeatureService = new TierFeatureService();
  });

  describe('trackFeatureUsage', () => {
    it('should increment feature usage successfully', async () => {
      // Arrange
      const userId = 'user-123';
      const featureName = 'max_products';
      const increment = 1;

      mockTierFeatureModel.prototype.incrementUsage.mockResolvedValue({
        id: 'feature-123',
        user_id: userId,
        feature_name: featureName,
        current_usage: 26,
        usage_limit: 50,
        last_reset_at: new Date(),
      });

      // Act
      const result = await tierFeatureService.trackFeatureUsage(userId, featureName, increment);

      // Assert
      expect(result).toBeDefined();
      expect(mockTierFeatureModel.prototype.incrementUsage).toHaveBeenCalledWith(
        userId,
        featureName,
        increment
      );
    });

    it('should handle atomic increment with race condition prevention', async () => {
      // Arrange
      const userId = 'user-123';
      const featureName = 'max_products';
      const increment = 1;

      mockTierFeatureModel.prototype.incrementUsageAtomic.mockResolvedValue({
        id: 'feature-123',
        user_id: userId,
        feature_name: featureName,
        current_usage: 26,
        usage_limit: 50,
      });

      // Act
      const result = await tierFeatureService.trackFeatureUsage(
        userId,
        featureName,
        increment,
        true
      );

      // Assert
      expect(result).toBeDefined();
      expect(mockTierFeatureModel.prototype.incrementUsageAtomic).toHaveBeenCalledWith(
        userId,
        featureName,
        increment
      );
    });

    it('should throw error when increment fails', async () => {
      // Arrange
      const userId = 'user-123';
      const featureName = 'max_products';
      const increment = 1;

      mockTierFeatureModel.prototype.incrementUsage.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(
        tierFeatureService.trackFeatureUsage(userId, featureName, increment)
      ).rejects.toThrow('Database error');
    });
  });

  describe('validateFeatureAccess', () => {
    it('should return access granted for unlimited feature', async () => {
      // Arrange
      const userId = 'user-123';
      const featureName = 'analytics_access';
      const tier = 'premium';

      mockTierFeatureDefinitionsModel.prototype.findBy.mockResolvedValue([
        {
          feature_name: featureName,
          feature_limit: null,
          feature_enabled: true,
        },
      ]);

      mockTierFeatureModel.prototype.getUserFeatureUsage.mockResolvedValue({
        [featureName]: { current: 0, limit: null },
      });

      // Act
      const result = await tierFeatureService.validateFeatureAccess(userId, featureName, tier);

      // Assert
      expect(result).toEqual({
        access_granted: true,
        feature_available: true,
        usage_within_limits: true,
        current_usage: 0,
        limit: null,
      });
    });

    it('should return access granted for feature within limits', async () => {
      // Arrange
      const userId = 'user-123';
      const featureName = 'max_products';
      const tier = 'free';

      mockTierFeatureDefinitionsModel.prototype.findBy.mockResolvedValue([
        {
          feature_name: featureName,
          feature_limit: 50,
          feature_enabled: true,
        },
      ]);

      mockTierFeatureModel.prototype.getUserFeatureUsage.mockResolvedValue({
        [featureName]: { current: 25, limit: 50 },
      });

      // Act
      const result = await tierFeatureService.validateFeatureAccess(userId, featureName, tier);

      // Assert
      expect(result).toEqual({
        access_granted: true,
        feature_available: true,
        usage_within_limits: true,
        current_usage: 25,
        limit: 50,
      });
    });

    it('should return access denied when usage limit exceeded', async () => {
      // Arrange
      const userId = 'user-123';
      const featureName = 'max_products';
      const tier = 'free';

      mockTierFeatureDefinitionsModel.prototype.findBy.mockResolvedValue([
        {
          feature_name: featureName,
          feature_limit: 50,
          feature_enabled: true,
        },
      ]);

      mockTierFeatureModel.prototype.getUserFeatureUsage.mockResolvedValue({
        [featureName]: { current: 50, limit: 50 },
      });

      // Act
      const result = await tierFeatureService.validateFeatureAccess(userId, featureName, tier);

      // Assert
      expect(result).toEqual({
        access_granted: false,
        feature_available: true,
        usage_within_limits: false,
        reason: 'usage_limit_exceeded',
        current_usage: 50,
        limit: 50,
      });
    });

    it('should return access denied when feature is not enabled', async () => {
      // Arrange
      const userId = 'user-123';
      const featureName = 'analytics_access';
      const tier = 'free';

      mockTierFeatureDefinitionsModel.prototype.findBy.mockResolvedValue([
        {
          feature_name: featureName,
          feature_limit: null,
          feature_enabled: false,
        },
      ]);

      // Act
      const result = await tierFeatureService.validateFeatureAccess(userId, featureName, tier);

      // Assert
      expect(result).toEqual({
        access_granted: false,
        feature_available: false,
        usage_within_limits: false,
        reason: 'feature_not_available',
        current_usage: 0,
        limit: null,
      });
    });

    it('should return access denied when feature definition not found', async () => {
      // Arrange
      const userId = 'user-123';
      const featureName = 'unknown_feature';
      const tier = 'free';

      mockTierFeatureDefinitionsModel.prototype.findBy.mockResolvedValue([]);

      // Act
      const result = await tierFeatureService.validateFeatureAccess(userId, featureName, tier);

      // Assert
      expect(result).toEqual({
        access_granted: false,
        feature_available: false,
        usage_within_limits: false,
        reason: 'feature_not_defined',
        current_usage: 0,
        limit: null,
      });
    });
  });

  describe('getUserFeatureUsage', () => {
    it('should return user feature usage for all features', async () => {
      // Arrange
      const userId = 'user-123';

      mockTierFeatureModel.prototype.getUserFeatureUsage.mockResolvedValue({
        max_products: { current: 25, limit: 50 },
        max_categories: { current: 10, limit: 20 },
        analytics_access: { current: 0, limit: null },
      });

      // Act
      const result = await tierFeatureService.getUserFeatureUsage(userId);

      // Assert
      expect(result).toEqual({
        max_products: { current: 25, limit: 50 },
        max_categories: { current: 10, limit: 20 },
        analytics_access: { current: 0, limit: null },
      });
    });

    it('should return empty object when no features found', async () => {
      // Arrange
      const userId = 'user-123';

      mockTierFeatureModel.prototype.getUserFeatureUsage.mockResolvedValue({});

      // Act
      const result = await tierFeatureService.getUserFeatureUsage(userId);

      // Assert
      expect(result).toEqual({});
    });
  });

  describe('resetUsageCounters', () => {
    it('should reset daily usage counters', async () => {
      // Arrange
      const resetType = 'daily';
      const date = new Date('2025-01-01T00:00:00Z');

      mockTierFeatureModel.prototype.resetUsageCounters.mockResolvedValue({
        reset_count: 150,
        reset_date: date,
      });

      // Act
      const result = await tierFeatureService.resetUsageCounters(resetType, date);

      // Assert
      expect(result).toEqual({
        reset_count: 150,
        reset_date: date,
      });
      expect(mockTierFeatureModel.prototype.resetUsageCounters).toHaveBeenCalledWith(
        resetType,
        date
      );
    });

    it('should reset weekly usage counters', async () => {
      // Arrange
      const resetType = 'weekly';
      const date = new Date('2025-01-01T00:00:00Z');

      mockTierFeatureModel.prototype.resetUsageCounters.mockResolvedValue({
        reset_count: 75,
        reset_date: date,
      });

      // Act
      const result = await tierFeatureService.resetUsageCounters(resetType, date);

      // Assert
      expect(result).toEqual({
        reset_count: 75,
        reset_date: date,
      });
    });

    it('should reset monthly usage counters', async () => {
      // Arrange
      const resetType = 'monthly';
      const date = new Date('2025-01-01T00:00:00Z');

      mockTierFeatureModel.prototype.resetUsageCounters.mockResolvedValue({
        reset_count: 25,
        reset_date: date,
      });

      // Act
      const result = await tierFeatureService.resetUsageCounters(resetType, date);

      // Assert
      expect(result).toEqual({
        reset_count: 25,
        reset_date: date,
      });
    });
  });

  describe('checkUsageThresholds', () => {
    it('should return warning when usage approaches limit', async () => {
      // Arrange
      const userId = 'user-123';
      const featureName = 'max_products';
      const threshold = 0.8; // 80%

      mockTierFeatureModel.prototype.getUserFeatureUsage.mockResolvedValue({
        [featureName]: { current: 40, limit: 50 },
      });

      // Act
      const result = await tierFeatureService.checkUsageThresholds(userId, featureName, threshold);

      // Assert
      expect(result).toEqual({
        threshold_exceeded: true,
        current_usage: 40,
        limit: 50,
        percentage: 0.8,
        warning_message: 'You are approaching your max_products limit (80% used)',
      });
    });

    it('should return no warning when usage is below threshold', async () => {
      // Arrange
      const userId = 'user-123';
      const featureName = 'max_products';
      const threshold = 0.8; // 80%

      mockTierFeatureModel.prototype.getUserFeatureUsage.mockResolvedValue({
        [featureName]: { current: 30, limit: 50 },
      });

      // Act
      const result = await tierFeatureService.checkUsageThresholds(userId, featureName, threshold);

      // Assert
      expect(result).toEqual({
        threshold_exceeded: false,
        current_usage: 30,
        limit: 50,
        percentage: 0.6,
        warning_message: null,
      });
    });

    it('should handle unlimited features', async () => {
      // Arrange
      const userId = 'user-123';
      const featureName = 'analytics_access';
      const threshold = 0.8;

      mockTierFeatureModel.prototype.getUserFeatureUsage.mockResolvedValue({
        [featureName]: { current: 0, limit: null },
      });

      // Act
      const result = await tierFeatureService.checkUsageThresholds(userId, featureName, threshold);

      // Assert
      expect(result).toEqual({
        threshold_exceeded: false,
        current_usage: 0,
        limit: null,
        percentage: 0,
        warning_message: null,
      });
    });
  });

  describe('getFeatureLimits', () => {
    it('should return feature limits for tier', async () => {
      // Arrange
      const tier = 'free';

      mockTierFeatureDefinitionsModel.prototype.findBy.mockResolvedValue([
        { feature_name: 'max_products', feature_limit: 50, feature_enabled: true },
        { feature_name: 'analytics_access', feature_limit: null, feature_enabled: false },
      ]);

      // Act
      const result = await tierFeatureService.getFeatureLimits(tier);

      // Assert
      expect(result).toEqual({
        max_products: { limit: 50, enabled: true },
        analytics_access: { limit: null, enabled: false },
      });
    });

    it('should return empty object when no features found for tier', async () => {
      // Arrange
      const tier = 'unknown';

      mockTierFeatureDefinitionsModel.prototype.findBy.mockResolvedValue([]);

      // Act
      const result = await tierFeatureService.getFeatureLimits(tier);

      // Assert
      expect(result).toEqual({});
    });
  });

  describe('createUserFeatureRecord', () => {
    it('should create new user feature record', async () => {
      // Arrange
      const userId = 'user-123';
      const featureName = 'max_products';
      const usageLimit = 50;

      mockTierFeatureModel.prototype.create.mockResolvedValue({
        id: 'feature-123',
        user_id: userId,
        feature_name: featureName,
        current_usage: 0,
        usage_limit: usageLimit,
        last_reset_at: new Date(),
      });

      // Act
      const result = await tierFeatureService.createUserFeatureRecord(
        userId,
        featureName,
        usageLimit
      );

      // Assert
      expect(result).toBeDefined();
      expect(mockTierFeatureModel.prototype.create).toHaveBeenCalledWith({
        user_id: userId,
        feature_name: featureName,
        current_usage: 0,
        usage_limit: usageLimit,
        last_reset_at: expect.any(Date),
      });
    });

    it('should create unlimited feature record', async () => {
      // Arrange
      const userId = 'user-123';
      const featureName = 'analytics_access';
      const usageLimit = null;

      mockTierFeatureModel.prototype.create.mockResolvedValue({
        id: 'feature-123',
        user_id: userId,
        feature_name: featureName,
        current_usage: 0,
        usage_limit: null,
        last_reset_at: new Date(),
      });

      // Act
      const result = await tierFeatureService.createUserFeatureRecord(
        userId,
        featureName,
        usageLimit
      );

      // Assert
      expect(result).toBeDefined();
      expect(mockTierFeatureModel.prototype.create).toHaveBeenCalledWith({
        user_id: userId,
        feature_name: featureName,
        current_usage: 0,
        usage_limit: null,
        last_reset_at: expect.any(Date),
      });
    });
  });
});
