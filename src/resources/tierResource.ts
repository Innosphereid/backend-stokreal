import {
  TierStatus,
  FeatureAvailability,
  UsageStatistics,
  InternalTierValidationResponse,
  TierFeatures,
  CurrentUsage,
  FeatureInfo,
  UsageDetails,
  UsageMetric,
} from '@/types/tier';
import { SubscriptionPlan } from '@/types';
import { FEATURE_DISPLAY_NAMES } from '@/constants/featureDisplayNames';

/**
 * Tier Resource - Formats tier-related data for API responses
 * Ensures consistent response structure across all tier endpoints
 */
export class TierResource {
  /**
   * Format tier status response
   */
  static formatTierStatusResponse(tierStatus: any): TierStatus {
    return {
      user_id: tierStatus.user_id,
      subscription_plan: tierStatus.subscription_plan,
      subscription_expires_at: tierStatus.subscription_expires_at,
      is_active: tierStatus.is_active,
      days_until_expiration: tierStatus.days_until_expiration,
      grace_period_active: tierStatus.grace_period_active,
      grace_period_expires_at: tierStatus.grace_period_expires_at,
      tier_features: this.formatTierFeatures(
        tierStatus.tier_features,
        tierStatus.subscription_plan
      ),
      current_usage: this.formatCurrentUsage(tierStatus.current_usage),
    };
  }

  /**
   * Format tier features based on subscription plan
   */
  static formatTierFeatures(features: any, subscriptionPlan: SubscriptionPlan): TierFeatures {
    const baseFeatures: TierFeatures = {
      max_products: 50,
      max_file_upload_size_mb: 5,
      analytics_access: false,
      export_capabilities: false,
      priority_support: false,
    };

    // Premium tier features
    if (subscriptionPlan === 'premium') {
      return {
        max_products: 'unlimited',
        max_file_upload_size_mb: 20,
        analytics_access: true,
        export_capabilities: true,
        priority_support: true,
      };
    }

    // Free tier features (with any custom overrides from features object)
    if (features) {
      return {
        max_products: features.max_products?.unlimited
          ? 'unlimited'
          : features.max_products?.limit || baseFeatures.max_products,
        max_file_upload_size_mb:
          features.max_file_upload_size_mb?.limit || baseFeatures.max_file_upload_size_mb,
        analytics_access: features.analytics_access?.enabled || baseFeatures.analytics_access,
        export_capabilities:
          features.export_capabilities?.enabled || baseFeatures.export_capabilities,
        priority_support: features.priority_support?.enabled || baseFeatures.priority_support,
      };
    }

    return baseFeatures;
  }

  /**
   * Format current usage data
   */
  static formatCurrentUsage(usage: any): CurrentUsage {
    return {
      products_count: usage?.products?.current || usage?.products_count || 0,
      storage_used_mb: usage?.storage?.current || usage?.storage_used_mb || 0,
      api_calls_today: usage?.api_calls?.current || usage?.api_calls_today || 0,
      notifications_sent_today:
        usage?.notifications?.current || usage?.notifications_sent_today || 0,
    };
  }

  /**
   * Format feature availability response
   */
  static formatFeatureAvailabilityResponse(
    features: Record<string, any>,
    userUsage: Record<string, any>,
    featureLimits: Record<string, any>,
    subscriptionPlan: SubscriptionPlan
  ): FeatureAvailability {
    const formattedFeatures: Record<string, FeatureInfo> = {};

    Object.keys(features).forEach(featureName => {
      const featureLimit = featureLimits[featureName];
      const currentUsage = userUsage[featureName]?.current || 0;
      const maxAllowed = featureLimit?.limit;

      if (!featureLimit?.enabled) {
        const upgradeMessage =
          subscriptionPlan === 'free' ? `Upgrade to Premium for ${featureName} access` : undefined;

        formattedFeatures[featureName] = {
          available: false,
          requires_upgrade: subscriptionPlan === 'free',
          ...(upgradeMessage && { upgrade_message: upgradeMessage }),
        };
      } else {
        const limitReached = maxAllowed !== null && currentUsage >= maxAllowed;

        formattedFeatures[featureName] = {
          available: !limitReached,
          limit_reached: limitReached,
          current_usage: currentUsage,
          max_allowed: maxAllowed || 'unlimited',
          requires_upgrade: limitReached && subscriptionPlan === 'free',
        };

        if (limitReached && subscriptionPlan === 'free') {
          formattedFeatures[featureName].upgrade_message =
            `Upgrade to Premium for unlimited ${featureName}`;
        }

        // Add file upload specific fields
        if (featureName === 'file_upload') {
          formattedFeatures[featureName].max_size_mb = subscriptionPlan === 'premium' ? 20 : 5;
        }
      }
    });

    return {
      features: formattedFeatures,
    };
  }

  /**
   * Format usage statistics response
   */
  static formatUsageStatisticsResponse(
    period: 'daily' | 'weekly' | 'monthly',
    userUsage: Record<string, any>,
    featureLimits: Record<string, any>,
    dateRange: { start: string; end: string }
  ): UsageStatistics {
    const usage: UsageDetails = {
      products: this.createUsageMetric('products', userUsage, featureLimits),
      api_calls: this.createUsageMetric('api_calls', userUsage, featureLimits),
      storage: this.createUsageMetric('storage', userUsage, featureLimits),
      notifications: this.createUsageMetric('notifications', userUsage, featureLimits),
    };

    return {
      period,
      date_range: dateRange,
      usage,
    };
  }

  /**
   * Create usage metric for a specific feature
   */
  static createUsageMetric(
    featureName: string,
    userUsage: Record<string, any>,
    featureLimits: Record<string, any>
  ): UsageMetric {
    const current = userUsage[featureName]?.current || 0;
    const limit = featureLimits[featureName]?.limit;
    const maxAllowed = limit || 'unlimited';

    let percentage = 0;
    let status: 'within_limit' | 'approaching_limit' | 'limit_exceeded' = 'within_limit';

    if (typeof maxAllowed === 'number') {
      percentage = Math.round((current / maxAllowed) * 100);

      if (percentage >= 100) {
        status = 'limit_exceeded';
      } else if (percentage >= 80) {
        status = 'approaching_limit';
      }
    }

    return {
      current_count: current,
      max_allowed: maxAllowed,
      percentage_used: percentage,
      status,
    };
  }

  /**
   * Format internal tier validation response
   */
  static formatInternalTierValidationResponse(
    userId: string,
    currentTier: SubscriptionPlan,
    accessGranted: boolean,
    featureAvailable: boolean,
    usageWithinLimits: boolean,
    tierInfo: {
      subscription_expires_at: Date | null;
      grace_period_active: boolean;
    }
  ): InternalTierValidationResponse {
    return {
      user_id: userId,
      current_tier: currentTier,
      access_granted: accessGranted,
      feature_available: featureAvailable,
      usage_within_limits: usageWithinLimits,
      tier_info: {
        subscription_expires_at: tierInfo.subscription_expires_at,
        grace_period_active: tierInfo.grace_period_active,
      },
    };
  }

  /**
   * Format tier validation error response
   */
  static formatTierValidationErrorResponse(
    currentTier: SubscriptionPlan,
    requiredTier: SubscriptionPlan,
    feature: string,
    reason: 'insufficient_tier' | 'feature_not_available' | 'usage_limit_exceeded'
  ) {
    let upgradeMessage: string;

    switch (reason) {
      case 'usage_limit_exceeded':
        upgradeMessage = `Upgrade to Premium for unlimited ${feature}`;
        break;
      case 'feature_not_available':
        upgradeMessage = `Upgrade to Premium for ${feature} access`;
        break;
      default:
        upgradeMessage = `Upgrade to Premium to access ${feature} features`;
    }

    return {
      current_tier: currentTier,
      required_tier: requiredTier,
      feature: feature,
      upgrade_url: '/api/v1/subscription/upgrade',
      upgrade_message: upgradeMessage,
    };
  }

  /**
   * Format bulk validation results
   */
  static formatBulkValidationResults(results: any[]) {
    return {
      results: results.map(result => ({
        user_id: result.user_id,
        feature: result.feature,
        validation: result.validation,
      })),
      total: results.length,
      successful: results.filter(r => !r.validation.error).length,
      failed: results.filter(r => r.validation.error).length,
    };
  }

  /**
   * Get feature display names for better user experience
   * @deprecated Use FEATURE_DISPLAY_NAMES from constants instead
   */
  static getFeatureDisplayNames(): Record<string, string> {
    return FEATURE_DISPLAY_NAMES;
  }

  /**
   * Get usage status colors for UI
   */
  static getUsageStatusColors(): Record<string, string> {
    return {
      within_limit: '#22c55e', // green
      approaching_limit: '#f59e0b', // amber
      limit_exceeded: '#ef4444', // red
    };
  }

  /**
   * Get tier upgrade benefits
   */
  static getTierUpgradeBenefits(currentTier: SubscriptionPlan): string[] {
    if (currentTier === 'free') {
      return [
        'Unlimited products',
        'Advanced analytics',
        'Data export capabilities',
        'Priority support',
        'Larger file uploads (20MB)',
        'Custom reports',
        'API integrations',
        'Webhooks support',
      ];
    }

    return [];
  }
}
