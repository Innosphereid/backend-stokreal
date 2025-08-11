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

// Helper functions to create proper mock objects
function createMockIncrementResult(overrides: Partial<any> = {}) {
  return {
    current_usage: 26,
    updated_at: new Date(),
    ...overrides,
  };
}

function createMockTierFeatureRecord(overrides: Partial<any> = {}) {
  return {
    id: 'feature-123',
    user_id: 'user-123',
    feature_name: 'max_products',
    current_usage: 25,
    usage_limit: 50,
    last_reset_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

function createMockResetCountersResult(overrides: Partial<any> = {}) {
  return {
    affectedRows: 150,
    ...overrides,
  };
}

function createMockCreateFeatureRecordResult(overrides: Partial<any> = {}) {
  return {
    id: 'feature-123',
    user_id: 'user-123',
    feature_name: 'max_products',
    current_usage: 0,
    usage_limit: 50,
    last_reset_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

function createMockTierFeatureDefinition(overrides: Partial<any> = {}) {
  return {
    id: 'def-123',
    tier: 'premium',
    feature_name: 'max_products',
    feature_limit: 50,
    feature_enabled: true,
    description: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

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

      mockTierFeatureModel.prototype.incrementUsage.mockResolvedValue(createMockIncrementResult());

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

      mockTierFeatureModel.prototype.incrementUsageAtomic.mockResolvedValue(
        createMockIncrementResult()
      );

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
      const featureName = 'unlimited_feature';
      const tier = 'premium';

      mockTierFeatureDefinitionsModel.prototype.findBy.mockResolvedValue([
        {
          id: 'def-123',
          tier,
          feature_name: featureName,
          feature_limit: null,
          feature_enabled: true,
          description: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      mockTierFeatureModel.prototype.getUserFeatureUsage.mockResolvedValue([
        createMockTierFeatureRecord({
          feature_name: featureName,
          current_usage: 0,
          usage_limit: null,
        }),
      ]);

      // Act
      const result = await tierFeatureService.validateFeatureAccess(userId, featureName, tier);

      // Assert
      expect(result.access_granted).toBe(true);
      expect(result.feature_available).toBe(true);
      expect(result.usage_within_limits).toBe(true);
      expect(result.current_usage).toBe(0);
      expect(result.limit).toBe(null);
    });

    it('should return access granted for feature within limits', async () => {
      // Arrange
      const userId = 'user-123';
      const featureName = 'limited_feature';
      const tier = 'free';

      mockTierFeatureDefinitionsModel.prototype.findBy.mockResolvedValue([
        createMockTierFeatureDefinition({
          tier,
          feature_name: featureName,
          feature_limit: 50,
        }),
      ]);

      mockTierFeatureModel.prototype.getUserFeatureUsage.mockResolvedValue([
        createMockTierFeatureRecord({
          feature_name: featureName,
          current_usage: 25,
          usage_limit: 50,
        }),
      ]);

      // Act
      const result = await tierFeatureService.validateFeatureAccess(userId, featureName, tier);

      // Assert
      expect(result.access_granted).toBe(true);
      expect(result.feature_available).toBe(true);
      expect(result.usage_within_limits).toBe(true);
      expect(result.current_usage).toBe(25);
      expect(result.limit).toBe(50);
    });

    it('should return access denied for feature exceeding limits', async () => {
      // Arrange
      const userId = 'user-123';
      const featureName = 'limited_feature';
      const tier = 'free';

      mockTierFeatureDefinitionsModel.prototype.findBy.mockResolvedValue([
        createMockTierFeatureDefinition({
          tier,
          feature_name: featureName,
          feature_limit: 50,
        }),
      ]);

      mockTierFeatureModel.prototype.getUserFeatureUsage.mockResolvedValue([
        createMockTierFeatureRecord({
          feature_name: featureName,
          current_usage: 50,
          usage_limit: 50,
        }),
      ]);

      // Act
      const result = await tierFeatureService.validateFeatureAccess(userId, featureName, tier);

      // Assert
      expect(result.access_granted).toBe(false);
      expect(result.feature_available).toBe(true);
      expect(result.usage_within_limits).toBe(false);
      expect(result.current_usage).toBe(50);
      expect(result.limit).toBe(50);
      expect(result.reason).toBe('usage_limit_exceeded');
    });

    it('should return access denied for undefined feature', async () => {
      // Arrange
      const userId = 'user-123';
      const featureName = 'undefined_feature';
      const tier = 'free';

      mockTierFeatureDefinitionsModel.prototype.findBy.mockResolvedValue([]);

      // Act
      const result = await tierFeatureService.validateFeatureAccess(userId, featureName, tier);

      // Assert
      expect(result.access_granted).toBe(false);
      expect(result.feature_available).toBe(false);
      expect(result.usage_within_limits).toBe(false);
      expect(result.current_usage).toBe(0);
      expect(result.limit).toBe(null);
      expect(result.reason).toBe('feature_not_defined');
    });

    it('should return access denied for disabled feature', async () => {
      // Arrange
      const userId = 'user-123';
      const featureName = 'disabled_feature';
      const tier = 'free';

      mockTierFeatureDefinitionsModel.prototype.findBy.mockResolvedValue([
        createMockTierFeatureDefinition({
          tier,
          feature_name: featureName,
          feature_limit: 50,
          feature_enabled: false,
        }),
      ]);

      // Act
      const result = await tierFeatureService.validateFeatureAccess(userId, featureName, tier);

      // Assert
      expect(result.access_granted).toBe(false);
      expect(result.feature_available).toBe(false);
      expect(result.usage_within_limits).toBe(false);
      expect(result.current_usage).toBe(0);
      expect(result.limit).toBe(null);
      expect(result.reason).toBe('feature_not_available');
    });
  });

  describe('getUserFeatureUsage', () => {
    it('should return user feature usage for all features', async () => {
      // Arrange
      const userId = 'user-123';

      mockTierFeatureModel.prototype.getUserFeatureUsage.mockResolvedValue([
        createMockTierFeatureRecord({
          feature_name: 'max_products',
          current_usage: 25,
          usage_limit: 50,
        }),
        createMockTierFeatureRecord({
          feature_name: 'api_calls',
          current_usage: 100,
          usage_limit: 1000,
        }),
      ]);

      // Act
      const result = await tierFeatureService.getUserFeatureUsage(userId);

      // Assert
      expect(result).toEqual({
        max_products: { current: 25, limit: 50 },
        api_calls: { current: 100, limit: 1000 },
      });
    });

    it('should return empty object when no features found', async () => {
      // Arrange
      const userId = 'user-123';

      mockTierFeatureModel.prototype.getUserFeatureUsage.mockResolvedValue([]);

      // Act
      const result = await tierFeatureService.getUserFeatureUsage(userId);

      // Assert
      expect(result).toEqual({});
    });

    it('should throw error when database query fails', async () => {
      // Arrange
      const userId = 'user-123';

      mockTierFeatureModel.prototype.getUserFeatureUsage.mockRejectedValue(
        new Error('Database error')
      );

      // Act & Assert
      await expect(tierFeatureService.getUserFeatureUsage(userId)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('resetUsageCounters', () => {
    it('should reset usage counters successfully', async () => {
      // Arrange
      const resetType = 'daily';
      const date = new Date();

      mockTierFeatureModel.prototype.resetUsageCounters.mockResolvedValue(
        createMockResetCountersResult()
      );

      // Act
      const result = await tierFeatureService.resetUsageCounters(resetType, date);

      // Assert
      expect(result).toBeDefined();
      expect(mockTierFeatureModel.prototype.resetUsageCounters).toHaveBeenCalledWith(
        resetType,
        date
      );
    });

    it('should handle monthly reset', async () => {
      // Arrange
      const resetType = 'monthly';
      const date = new Date();

      mockTierFeatureModel.prototype.resetUsageCounters.mockResolvedValue(
        createMockResetCountersResult({ affectedRows: 75 })
      );

      // Act
      const result = await tierFeatureService.resetUsageCounters(resetType, date);

      // Assert
      expect(result.affectedRows).toBe(75);
    });

    it('should handle yearly reset', async () => {
      // Arrange
      const resetType = 'yearly';
      const date = new Date();

      mockTierFeatureModel.prototype.resetUsageCounters.mockResolvedValue(
        createMockResetCountersResult({ affectedRows: 25 })
      );

      // Act
      const result = await tierFeatureService.resetUsageCounters(resetType, date);

      // Assert
      expect(result.affectedRows).toBe(25);
    });

    it('should throw error when reset fails', async () => {
      // Arrange
      const resetType = 'daily';
      const date = new Date();

      mockTierFeatureModel.prototype.resetUsageCounters.mockRejectedValue(
        new Error('Database error')
      );

      // Act & Assert
      await expect(tierFeatureService.resetUsageCounters(resetType, date)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('checkUsageThresholds', () => {
    it('should return threshold exceeded for high usage', async () => {
      // Arrange
      const userId = 'user-123';
      const featureName = 'max_products';
      const threshold = 0.8;

      mockTierFeatureModel.prototype.getUserFeatureUsage.mockResolvedValue([
        createMockTierFeatureRecord({
          feature_name: featureName,
          current_usage: 40,
          usage_limit: 50,
        }),
      ]);

      // Act
      const result = await tierFeatureService.checkUsageThresholds(userId, featureName, threshold);

      // Assert
      expect(result.threshold_exceeded).toBe(true);
      expect(result.current_usage).toBe(40);
      expect(result.limit).toBe(50);
      expect(result.percentage).toBe(0.8);
      expect(result.warning_message).toContain(
        'You are approaching your max_products limit (80% used)'
      );
    });

    it('should return threshold not exceeded for low usage', async () => {
      // Arrange
      const userId = 'user-123';
      const featureName = 'max_products';
      const threshold = 0.8;

      mockTierFeatureModel.prototype.getUserFeatureUsage.mockResolvedValue([
        createMockTierFeatureRecord({
          feature_name: featureName,
          current_usage: 30,
          usage_limit: 50,
        }),
      ]);

      // Act
      const result = await tierFeatureService.checkUsageThresholds(userId, featureName, threshold);

      // Assert
      expect(result.threshold_exceeded).toBe(false);
      expect(result.current_usage).toBe(30);
      expect(result.limit).toBe(50);
      expect(result.percentage).toBe(0.6);
      expect(result.warning_message).toBe(null);
    });

    it('should handle unlimited features', async () => {
      // Arrange
      const userId = 'user-123';
      const featureName = 'unlimited_feature';
      const threshold = 0.8;

      mockTierFeatureModel.prototype.getUserFeatureUsage.mockResolvedValue([
        createMockTierFeatureRecord({
          feature_name: featureName,
          current_usage: 0,
          usage_limit: null,
        }),
      ]);

      // Act
      const result = await tierFeatureService.checkUsageThresholds(userId, featureName, threshold);

      // Assert
      expect(result.threshold_exceeded).toBe(false);
      expect(result.current_usage).toBe(0);
      expect(result.limit).toBe(null);
      expect(result.percentage).toBe(0);
      expect(result.warning_message).toBe(null);
    });

    it('should handle feature not found', async () => {
      // Arrange
      const userId = 'user-123';
      const featureName = 'nonexistent_feature';
      const threshold = 0.8;

      mockTierFeatureModel.prototype.getUserFeatureUsage.mockResolvedValue([]);

      // Act
      const result = await tierFeatureService.checkUsageThresholds(userId, featureName, threshold);

      // Assert
      expect(result.threshold_exceeded).toBe(false);
      expect(result.current_usage).toBe(0);
      expect(result.limit).toBe(null);
      expect(result.percentage).toBe(0);
      expect(result.warning_message).toBe(null);
    });
  });

  describe('getFeatureLimits', () => {
    it('should return feature limits for tier', async () => {
      // Arrange
      const tier = 'premium';

      mockTierFeatureDefinitionsModel.prototype.findBy.mockResolvedValue([
        createMockTierFeatureDefinition({
          id: 'def-1',
          tier,
          feature_name: 'max_products',
          feature_limit: 1000,
        }),
        createMockTierFeatureDefinition({
          id: 'def-2',
          tier,
          feature_name: 'api_calls',
          feature_limit: 10000,
        }),
        createMockTierFeatureDefinition({
          id: 'def-3',
          tier,
          feature_name: 'analytics',
          feature_limit: null,
          feature_enabled: false,
        }),
      ]);

      // Act
      const result = await tierFeatureService.getFeatureLimits(tier);

      // Assert
      expect(result).toEqual({
        max_products: { limit: 1000, enabled: true },
        api_calls: { limit: 10000, enabled: true },
        analytics: { limit: null, enabled: false },
      });
    });

    it('should return empty object for tier with no features', async () => {
      // Arrange
      const tier = 'basic';

      mockTierFeatureDefinitionsModel.prototype.findBy.mockResolvedValue([]);

      // Act
      const result = await tierFeatureService.getFeatureLimits(tier);

      // Assert
      expect(result).toEqual({});
    });
  });

  describe('createUserFeatureRecord', () => {
    it('should create user feature record with limit', async () => {
      // Arrange
      const userId = 'user-123';
      const featureName = 'max_products';
      const usageLimit = 50;

      mockTierFeatureModel.prototype.create.mockResolvedValue(
        createMockCreateFeatureRecordResult({
          feature_name: featureName,
          usage_limit: usageLimit,
        })
      );

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

    it('should create user feature record without limit', async () => {
      // Arrange
      const userId = 'user-123';
      const featureName = 'unlimited_feature';
      const usageLimit = null;

      mockTierFeatureModel.prototype.create.mockResolvedValue(
        createMockCreateFeatureRecordResult({
          feature_name: featureName,
          usage_limit: null,
        })
      );

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
        last_reset_at: expect.any(Date),
      });
    });

    it('should throw error when creation fails', async () => {
      // Arrange
      const userId = 'user-123';
      const featureName = 'max_products';
      const usageLimit = 50;

      mockTierFeatureModel.prototype.create.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(
        tierFeatureService.createUserFeatureRecord(userId, featureName, usageLimit)
      ).rejects.toThrow('Database error');
    });
  });
});
