import { Request, Response } from 'express';
import { TierService } from '@/services/TierService';
import { TierFeatureService } from '@/services/TierFeatureService';
import { AuditLogService } from '@/services/AuditLogService';
import { createSuccessResponse } from '@/utils/response';
import { asyncHandler } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';
import { createError } from '@/utils/errors';
import { AuthenticatedRequest, JWTUser } from '@/types/jwt';
import {
  TierStatus,
  FeatureAvailability,
  UsageStatistics,
  FeatureAvailabilityQuery,
  UsageStatisticsQuery,
  TierFeatures,
  CurrentUsage,
  FeatureInfo,
  UsageDetails,
  UsageMetric,
} from '@/types/tier';

/**
 * Controller for tier-related API endpoints
 * Handles user tier status, feature availability, and usage statistics
 */
export class TierController {
  private readonly tierService: TierService;
  private readonly tierFeatureService: TierFeatureService;
  private readonly auditLogService: AuditLogService;

  constructor() {
    this.tierService = new TierService();
    this.tierFeatureService = new TierFeatureService();
    this.auditLogService = AuditLogService.getInstance();
  }

  /**
   * Get comprehensive user tier status
   * GET /api/v1/users/tier-status
   */
  getTierStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    logger.info('Tier status request received');

    const authenticatedReq = req as AuthenticatedRequest;
    const user = authenticatedReq.user as JWTUser;

    if (!user?.id) {
      // Log failed authentication
      await this.auditLogService.log({
        action: 'tier_status_access_denied',
        resource: 'tier',
        details: { reason: 'User not authenticated' },
        ipAddress,
        userAgent,
        success: false,
      });
      throw createError('User not authenticated', 401);
    }

    try {
      // Get tier status from service
      const tierStatus = await this.tierService.getUserTierStatus(user.id);

      // Format response according to API specification
      const formattedResponse: TierStatus = {
        user_id: tierStatus.user_id,
        subscription_plan: tierStatus.subscription_plan,
        subscription_expires_at: tierStatus.subscription_expires_at,
        is_active: tierStatus.is_active,
        days_until_expiration: tierStatus.days_until_expiration,
        grace_period_active: tierStatus.grace_period_active,
        grace_period_expires_at: tierStatus.grace_period_expires_at,
        tier_features: this.formatTierFeatures(tierStatus.tier_features),
        current_usage: this.formatCurrentUsage(tierStatus.current_usage),
      };

      const successResponse = createSuccessResponse(
        'Tier status retrieved successfully',
        formattedResponse
      );

      // Log successful tier status retrieval
      await this.auditLogService.log({
        userId: user.id,
        action: 'tier_status_retrieved',
        resource: 'tier',
        details: {
          current_tier: tierStatus.subscription_plan,
          is_active: tierStatus.is_active,
          days_until_expiration: tierStatus.days_until_expiration,
          grace_period_active: tierStatus.grace_period_active,
        },
        ipAddress,
        userAgent,
        success: true,
      });

      logger.info(`Tier status retrieved for user ${user.id}`);
      res.status(200).json(successResponse);
    } catch (error) {
      // Log failed tier status retrieval
      await this.auditLogService.log({
        userId: user.id,
        action: 'tier_status_retrieval_failed',
        resource: 'tier',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        ipAddress,
        userAgent,
        success: false,
      });

      logger.error(`Failed to get tier status for user ${user.id}:`, error);
      throw createError('Failed to retrieve tier status', 500);
    }
  });

  /**
   * Get feature availability for user
   * GET /api/v1/users/feature-availability
   */
  getFeatureAvailability = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    logger.info('Feature availability request received');

    const authenticatedReq = req as AuthenticatedRequest;
    const user = authenticatedReq.user as JWTUser;
    const query = req.query as FeatureAvailabilityQuery;

    if (!user?.id) {
      // Log failed authentication
      await this.auditLogService.log({
        action: 'feature_availability_access_denied',
        resource: 'tier',
        details: { reason: 'User not authenticated', feature: query.feature },
        ipAddress,
        userAgent,
        success: false,
      });
      throw createError('User not authenticated', 401);
    }

    try {
      // Get user tier status
      const tierStatus = await this.tierService.getUserTierStatus(user.id);

      // Get feature limits for the user's tier
      const featureLimits = await this.tierFeatureService.getFeatureLimits(
        tierStatus.subscription_plan
      );

      // Get current usage
      const userUsage = await this.tierFeatureService.getUserFeatureUsage(user.id);

      // If specific feature requested, filter to that feature
      const featuresToCheck = query.feature ? [query.feature] : Object.keys(featureLimits);

      const features: Record<string, FeatureInfo> = {};

      for (const featureName of featuresToCheck) {
        const featureLimit = featureLimits[featureName];
        const currentUsage = userUsage[featureName]?.current || 0;
        const maxAllowed = featureLimit?.limit;

        if (!featureLimit?.enabled) {
          features[featureName] = {
            available: false,
            requires_upgrade: true,
            upgrade_message: `Upgrade to Premium for ${featureName} access`,
          };
        } else {
          const limitReached =
            maxAllowed !== null && maxAllowed !== undefined && currentUsage >= maxAllowed;

          features[featureName] = {
            available: !limitReached,
            limit_reached: limitReached,
            current_usage: currentUsage,
            max_allowed: maxAllowed || 'unlimited',
            requires_upgrade: limitReached && tierStatus.subscription_plan === 'free',
          };

          if (limitReached && tierStatus.subscription_plan === 'free') {
            features[featureName].upgrade_message =
              `Upgrade to Premium for unlimited ${featureName}`;
          }
        }
      }

      const responseData: FeatureAvailability = {
        features,
      };

      const successResponse = createSuccessResponse(
        'Feature availability retrieved successfully',
        responseData
      );

      // Log successful feature availability check
      await this.auditLogService.log({
        userId: user.id,
        action: 'feature_availability_checked',
        resource: 'tier',
        details: {
          requested_feature: query.feature || 'all',
          features_checked: featuresToCheck,
          total_features: Object.keys(features).length,
        },
        ipAddress,
        userAgent,
        success: true,
      });

      logger.info(`Feature availability retrieved for user ${user.id}`);
      res.status(200).json(successResponse);
    } catch (error) {
      // Log failed feature availability check
      await this.auditLogService.log({
        userId: user.id,
        action: 'feature_availability_check_failed',
        resource: 'tier',
        details: {
          requested_feature: query.feature || 'all',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        ipAddress,
        userAgent,
        success: false,
      });

      logger.error(`Failed to get feature availability for user ${user.id}:`, error);
      throw createError('Failed to retrieve feature availability', 500);
    }
  });

  /**
   * Get usage statistics for user
   * GET /api/v1/users/usage-stats
   */
  getUsageStatistics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    logger.info('Usage statistics request received');

    const authenticatedReq = req as AuthenticatedRequest;
    const user = authenticatedReq.user as JWTUser;
    const query = req.query as UsageStatisticsQuery;

    if (!user?.id) {
      // Log failed authentication
      await this.auditLogService.log({
        action: 'usage_stats_access_denied',
        resource: 'tier',
        details: { reason: 'User not authenticated', period: query.period },
        ipAddress,
        userAgent,
        success: false,
      });
      throw createError('User not authenticated', 401);
    }

    const period = query.period || 'daily';

    try {
      // Get tier status and usage data
      const tierStatus = await this.tierService.getUserTierStatus(user.id);
      const userUsage = await this.tierFeatureService.getUserFeatureUsage(user.id);
      const featureLimits = await this.tierFeatureService.getFeatureLimits(
        tierStatus.subscription_plan
      );

      // Calculate date range based on period
      const dateRange = this.calculateDateRange(period);

      // Build usage details
      const usage: UsageDetails = {
        products: this.createUsageMetric('products', userUsage, featureLimits),
        api_calls: this.createUsageMetric('api_calls', userUsage, featureLimits),
        storage: this.createUsageMetric('storage', userUsage, featureLimits),
        notifications: this.createUsageMetric('notifications', userUsage, featureLimits),
      };

      const responseData: UsageStatistics = {
        period,
        date_range: dateRange,
        usage,
      };

      const successResponse = createSuccessResponse(
        'Usage statistics retrieved successfully',
        responseData
      );

      // Log successful usage statistics retrieval
      await this.auditLogService.log({
        userId: user.id,
        action: 'usage_stats_retrieved',
        resource: 'tier',
        details: {
          period,
          date_range: dateRange,
          usage_metrics: Object.keys(usage),
        },
        ipAddress,
        userAgent,
        success: true,
      });

      logger.info(`Usage statistics retrieved for user ${user.id}`);
      res.status(200).json(successResponse);
    } catch (error) {
      // Log failed usage statistics retrieval
      await this.auditLogService.log({
        userId: user.id,
        action: 'usage_stats_retrieval_failed',
        resource: 'tier',
        details: {
          period,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        ipAddress,
        userAgent,
        success: false,
      });

      logger.error(`Failed to get usage statistics for user ${user.id}:`, error);
      throw createError('Failed to retrieve usage statistics', 500);
    }
  });

  /**
   * Format tier features for API response
   */
  private formatTierFeatures(tierFeatures: Record<string, any>): TierFeatures {
    return {
      max_products: tierFeatures.max_products?.unlimited
        ? 'unlimited'
        : tierFeatures.max_products?.limit || 50,
      max_file_upload_size_mb: tierFeatures.max_file_upload_size_mb?.limit || 5,
      analytics_access: tierFeatures.analytics_access?.enabled || false,
      export_capabilities: tierFeatures.export_capabilities?.enabled || false,
      priority_support: tierFeatures.priority_support?.enabled || false,
    };
  }

  /**
   * Format current usage for API response
   */
  private formatCurrentUsage(currentUsage: Record<string, any>): CurrentUsage {
    return {
      products_count: currentUsage.products?.current || 0,
      storage_used_mb: currentUsage.storage?.current || 0,
      api_calls_today: currentUsage.api_calls?.current || 0,
      notifications_sent_today: currentUsage.notifications?.current || 0,
    };
  }

  /**
   * Calculate date range based on period
   */
  private calculateDateRange(period: 'daily' | 'weekly' | 'monthly'): {
    start: string;
    end: string;
  } {
    const now = new Date();
    let start: Date;

    switch (period) {
      case 'weekly':
        start = new Date(now);
        start.setDate(start.getDate() - 7);
        break;
      case 'monthly':
        start = new Date(now);
        start.setMonth(start.getMonth() - 1);
        break;
      default: // daily
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        break;
    }

    return {
      start: start.toISOString(),
      end: now.toISOString(),
    };
  }

  /**
   * Create usage metric from feature data
   */
  private createUsageMetric(
    featureName: string,
    userUsage: Record<string, any>,
    featureLimits: Record<string, any>
  ): UsageMetric {
    const current = userUsage[featureName]?.current || 0;
    const limit = featureLimits[featureName]?.limit;
    const maxAllowed = limit || 'unlimited';

    let percentage = 0;
    let status: 'within_limit' | 'approaching_limit' | 'limit_exceeded' = 'within_limit';

    if (typeof maxAllowed === 'number' && maxAllowed > 0) {
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
}
