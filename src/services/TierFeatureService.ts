import { TierFeatureModel } from '../models/TierFeatureModel';
import { TierFeatureDefinitionsModel } from '../models/TierFeatureDefinitionsModel';
import { logger } from '../utils/logger';

export interface FeatureUsage {
  current: number;
  limit: number | null;
}

export interface FeatureValidationResult {
  access_granted: boolean;
  feature_available: boolean;
  usage_within_limits: boolean;
  reason?: string;
  current_usage: number;
  limit: number | null;
}

export interface UsageThresholdResult {
  threshold_exceeded: boolean;
  current_usage: number;
  limit: number | null;
  percentage: number;
  warning_message: string | null;
}

// Database operation result interfaces
export interface TierFeatureRecord {
  id: string;
  user_id: string;
  feature_name: string;
  current_usage: number;
  usage_limit: number | null;
  last_reset_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface IncrementResult {
  current_usage: number;
  updated_at: Date;
}

export interface CreateFeatureRecordResult {
  id: string;
  user_id: string;
  feature_name: string;
  current_usage: number;
  usage_limit: number | null;
  last_reset_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ResetCountersResult {
  affectedRows: number;
}

export class TierFeatureService {
  private readonly tierFeatureModel: TierFeatureModel;
  private readonly tierFeatureDefinitionsModel: TierFeatureDefinitionsModel;

  constructor() {
    this.tierFeatureModel = new TierFeatureModel();
    this.tierFeatureDefinitionsModel = new TierFeatureDefinitionsModel();
  }

  /**
   * Track feature usage for a user
   */
  async trackFeatureUsage(
    userId: string,
    featureName: string,
    increment: number,
    atomic: boolean = false
  ): Promise<IncrementResult> {
    try {
      if (atomic) {
        return await this.tierFeatureModel.incrementUsageAtomic(userId, featureName, increment);
      } else {
        return await this.tierFeatureModel.incrementUsage(userId, featureName, increment);
      }
    } catch (error) {
      logger.error(
        `Failed to track feature usage for user ${userId}, feature ${featureName}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Validate feature access for a user
   */
  async validateFeatureAccess(
    userId: string,
    featureName: string,
    tier: string
  ): Promise<FeatureValidationResult> {
    try {
      // Get feature definition for the tier
      const featureDefinitions = await this.tierFeatureDefinitionsModel.findBy({
        tier,
        feature_name: featureName,
      });

      if (featureDefinitions.length === 0) {
        return {
          access_granted: false,
          feature_available: false,
          usage_within_limits: false,
          reason: 'feature_not_defined',
          current_usage: 0,
          limit: null,
        };
      }

      const featureDefinition = featureDefinitions[0];

      // Check if feature is enabled
      if (!featureDefinition?.feature_enabled) {
        return {
          access_granted: false,
          feature_available: false,
          usage_within_limits: false,
          reason: 'feature_not_available',
          current_usage: 0,
          limit: null,
        };
      }

      // Get current usage
      const userFeatureUsageArr = await this.tierFeatureModel.getUserFeatureUsage(userId);
      const userFeatureUsage: Record<string, FeatureUsage> = {};
      for (const row of userFeatureUsageArr) {
        userFeatureUsage[row.feature_name] = { current: row.current_usage, limit: row.usage_limit };
      }
      const currentUsage = userFeatureUsage[featureName]?.current || 0;
      const limit = featureDefinition?.feature_limit;

      // Check if usage is within limits
      const usageWithinLimits = limit === null || currentUsage < limit;

      const result: FeatureValidationResult = {
        access_granted: usageWithinLimits,
        feature_available: true,
        usage_within_limits: usageWithinLimits,
        current_usage: currentUsage,
        limit: limit,
      };

      if (!usageWithinLimits) {
        result.reason = 'usage_limit_exceeded';
      }

      return result;
    } catch (error) {
      logger.error(
        `Failed to validate feature access for user ${userId}, feature ${featureName}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get user feature usage for all features
   */
  async getUserFeatureUsage(userId: string): Promise<Record<string, FeatureUsage>> {
    try {
      const usageArr = await this.tierFeatureModel.getUserFeatureUsage(userId);
      const usage: Record<string, FeatureUsage> = {};
      for (const row of usageArr) {
        usage[row.feature_name] = { current: row.current_usage, limit: row.usage_limit };
      }
      return usage;
    } catch (error) {
      logger.error(`Failed to get user feature usage for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Reset usage counters based on type
   */
  async resetUsageCounters(resetType: string, date: Date): Promise<ResetCountersResult> {
    try {
      return await this.tierFeatureModel.resetUsageCounters(resetType, date);
    } catch (error) {
      logger.error(`Failed to reset usage counters for type ${resetType}:`, error);
      throw error;
    }
  }

  /**
   * Check if usage exceeds threshold
   */
  async checkUsageThresholds(
    userId: string,
    featureName: string,
    threshold: number
  ): Promise<UsageThresholdResult> {
    try {
      const userFeatureUsageArr = await this.tierFeatureModel.getUserFeatureUsage(userId);
      const userFeatureUsage: Record<string, FeatureUsage> = {};
      for (const row of userFeatureUsageArr) {
        userFeatureUsage[row.feature_name] = { current: row.current_usage, limit: row.usage_limit };
      }
      const featureUsage = userFeatureUsage[featureName];

      if (!featureUsage) {
        return {
          threshold_exceeded: false,
          current_usage: 0,
          limit: null,
          percentage: 0,
          warning_message: null,
        };
      }

      const { current, limit } = featureUsage;
      const percentage = limit ? current / limit : 0;
      const thresholdExceeded = percentage >= threshold;

      const warningMessage = thresholdExceeded
        ? `You are approaching your ${featureName} limit (${Math.round(percentage * 100)}% used)`
        : null;

      return {
        threshold_exceeded: thresholdExceeded,
        current_usage: current,
        limit: limit,
        percentage: percentage,
        warning_message: warningMessage,
      };
    } catch (error) {
      logger.error(
        `Failed to check usage thresholds for user ${userId}, feature ${featureName}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get feature limits for a tier
   */
  async getFeatureLimits(
    tier: string
  ): Promise<Record<string, { limit: number | null; enabled: boolean }>> {
    try {
      const features = await this.tierFeatureDefinitionsModel.findBy({ tier });
      const limits: Record<string, { limit: number | null; enabled: boolean }> = {};

      for (const feature of features) {
        limits[feature.feature_name] = {
          limit: feature.feature_limit,
          enabled: feature.feature_enabled,
        };
      }

      return limits;
    } catch (error) {
      logger.error(`Failed to get feature limits for tier ${tier}:`, error);
      throw error;
    }
  }

  /**
   * Create user feature record
   */
  async createUserFeatureRecord(
    userId: string,
    featureName: string,
    usageLimit: number | null
  ): Promise<CreateFeatureRecordResult> {
    try {
      const createData: {
        user_id: string;
        feature_name: string;
        current_usage: number;
        usage_limit?: number;
        last_reset_at: Date;
      } = {
        user_id: userId,
        feature_name: featureName,
        current_usage: 0,
        last_reset_at: new Date(),
      };
      if (usageLimit !== null) {
        createData.usage_limit = usageLimit;
      }
      return await this.tierFeatureModel.create(createData);
    } catch (error) {
      logger.error(
        `Failed to create user feature record for user ${userId}, feature ${featureName}:`,
        error
      );
      throw error;
    }
  }
}
