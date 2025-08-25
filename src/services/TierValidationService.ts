import { TierService } from './TierService';
import { TierFeatureService } from './TierFeatureService';
import { logger } from '../utils/logger';
import { SubscriptionPlan } from '../types';

export interface TierValidationResult {
  canProceed: boolean;
  reason?: string;
  warning?: string;
  upgradePrompt?: string;
  currentTier: SubscriptionPlan;
  feature: string;
  currentUsage: number;
  limit: number | null;
  remaining: number | 'unlimited';
}

export interface BulkTierValidationResult {
  products: TierValidationResult;
  categories: TierValidationResult;
  overallAccess: boolean;
}

export class TierValidationService {
  private readonly tierService: TierService;
  private readonly tierFeatureService: TierFeatureService;

  constructor() {
    this.tierService = new TierService();
    this.tierFeatureService = new TierFeatureService();
  }

  /**
   * Validate if user can create a product based on tier limits
   */
  async validateProductCreation(userId: string): Promise<TierValidationResult> {
    try {
      const tierStatus = await this.tierService.getUserTierStatus(userId);
      const currentUsage = tierStatus.current_usage.products?.current || 0;
      const maxProducts = tierStatus.tier_features.products?.limit;

      return this.validateFeatureAccess(
        'products',
        currentUsage,
        maxProducts || null,
        tierStatus.subscription_plan
      );
    } catch (error) {
      logger.error(`Failed to validate product creation for user ${userId}:`, error);
      // Default to allowing creation if validation fails
      return {
        canProceed: true,
        currentTier: 'free',
        feature: 'products',
        currentUsage: 0,
        limit: 50,
        remaining: 50,
      };
    }
  }

  /**
   * Validate if user can create a category based on tier limits
   */
  async validateCategoryCreation(userId: string): Promise<TierValidationResult> {
    try {
      const tierStatus = await this.tierService.getUserTierStatus(userId);
      const currentUsage = tierStatus.current_usage.categories?.current || 0;
      const maxCategories = tierStatus.tier_features.categories?.limit;

      return this.validateFeatureAccess(
        'categories',
        currentUsage,
        maxCategories || null,
        tierStatus.subscription_plan
      );
    } catch (error) {
      logger.error(`Failed to validate category creation for user ${userId}:`, error);
      // Default to allowing creation if validation fails
      return {
        canProceed: true,
        currentTier: 'free',
        feature: 'categories',
        currentUsage: 0,
        limit: 20,
        remaining: 20,
      };
    }
  }

  /**
   * Validate bulk operations (creating both product and category)
   */
  async validateBulkCreation(userId: string): Promise<BulkTierValidationResult> {
    try {
      const [productValidation, categoryValidation] = await Promise.all([
        this.validateProductCreation(userId),
        this.validateCategoryCreation(userId),
      ]);

      return {
        products: productValidation,
        categories: categoryValidation,
        overallAccess: productValidation.canProceed && categoryValidation.canProceed,
      };
    } catch (error) {
      logger.error(`Failed to validate bulk creation for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Validate feature access using TierFeatureService
   */
  async validateFeatureAccessDirect(
    userId: string,
    featureName: string
  ): Promise<TierValidationResult> {
    try {
      const tierStatus = await this.tierService.getUserTierStatus(userId);
      const featureValidation = await this.tierFeatureService.validateFeatureAccess(
        userId,
        featureName,
        tierStatus.subscription_plan
      );

      const currentUsage = featureValidation.current_usage;
      const limit = featureValidation.limit;

      return {
        canProceed: featureValidation.access_granted,
        ...(featureValidation.reason && { reason: featureValidation.reason }),
        currentTier: tierStatus.subscription_plan,
        feature: featureName,
        currentUsage,
        limit,
        remaining: limit === null ? 'unlimited' : Math.max(0, limit - currentUsage),
      };
    } catch (error) {
      logger.error(
        `Failed to validate feature access for user ${userId}, feature ${featureName}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get comprehensive tier status for a user
   */
  async getUserTierStatus(userId: string) {
    return this.tierService.getUserTierStatus(userId);
  }

  /**
   * Track feature usage
   */
  async trackFeatureUsage(userId: string, featureName: string, increment: number) {
    return this.tierFeatureService.trackFeatureUsage(userId, featureName, increment);
  }

  /**
   * Check if user is approaching tier limits (80% threshold)
   */
  private isApproachingLimit(currentUsage: number, limit: number | null): boolean {
    if (limit === null) return false; // Unlimited
    const threshold = Math.floor(limit * 0.8);
    return currentUsage >= threshold;
  }

  /**
   * Generate upgrade prompt message
   */
  private generateUpgradePrompt(feature: string, currentTier: SubscriptionPlan): string {
    if (currentTier === 'premium') return '';

    const featureMap: Record<string, string> = {
      products: 'unlimited products',
      categories: 'unlimited categories',
      storage: 'increased storage',
      analytics: 'advanced analytics',
      support: 'priority support',
    };

    const featureDescription = featureMap[feature] || feature;
    return `Upgrade to Premium for ${featureDescription} and advanced features.`;
  }

  /**
   * Core validation logic for feature access
   */
  private validateFeatureAccess(
    feature: string,
    currentUsage: number,
    limit: number | null,
    currentTier: SubscriptionPlan
  ): TierValidationResult {
    // Check if user can proceed
    if (limit === null) {
      // Unlimited access
      return {
        canProceed: true,
        currentTier,
        feature,
        currentUsage,
        limit: null,
        remaining: 'unlimited',
      };
    }

    if (currentUsage >= limit) {
      // Limit reached
      const reason = `${feature.charAt(0).toUpperCase() + feature.slice(1)} limit reached. Maximum ${limit} ${feature} allowed for ${currentTier} tier.`;
      return {
        canProceed: false,
        reason,
        currentTier,
        feature,
        currentUsage,
        limit,
        remaining: 0,
        upgradePrompt: this.generateUpgradePrompt(feature, currentTier),
      };
    }

    // Check if approaching limit
    if (this.isApproachingLimit(currentUsage, limit)) {
      const remaining = limit - currentUsage;
      return {
        canProceed: true,
        warning: `You're approaching your ${feature} limit. Only ${remaining} ${feature} remaining.`,
        upgradePrompt: this.generateUpgradePrompt(feature, currentTier),
        currentTier,
        feature,
        currentUsage,
        limit,
        remaining,
      };
    }

    // Well within limits
    return {
      canProceed: true,
      currentTier,
      feature,
      currentUsage,
      limit,
      remaining: limit - currentUsage,
    };
  }
}
