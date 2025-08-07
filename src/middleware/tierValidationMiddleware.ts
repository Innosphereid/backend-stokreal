import { Request, Response, NextFunction } from 'express';
import { TierService } from '../services/TierService';
import { TierFeatureService } from '../services/TierFeatureService';
import { logger } from '../utils/logger';

export interface TierValidationOptions {
  requiredTier: 'free' | 'premium';
  feature?: string;
  action?: string;
  skipUsageCheck?: boolean;
}

export function tierValidationMiddleware(options: TierValidationOptions) {
  const tierService = new TierService();
  const tierFeatureService = new TierFeatureService();

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract JWT token from authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({
          status: 401,
          message: 'Authorization header required',
          error: 'UNAUTHORIZED',
        });
      }

      // Validate JWT token format
      const tokenParts = authHeader.split(' ');
      if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        return res.status(401).json({
          status: 401,
          message: 'Invalid authorization header format',
          error: 'UNAUTHORIZED',
        });
      }

      // Extract user from JWT token (assuming JWT middleware has already processed it)
      const user = (req as any).user;
      if (!user || !user.id) {
        return res.status(401).json({
          status: 401,
          message: 'Invalid or missing user information',
          error: 'UNAUTHORIZED',
        });
      }

      // Get user tier status
      const tierStatus = await tierService.getUserTierStatus(user.id);

      // Check subscription status
      if (options.requiredTier === 'premium' && tierStatus.subscription_plan === 'free') {
        return res.status(403).json({
          status: 403,
          message: 'Insufficient tier privileges',
          error: 'TIER_UPGRADE_REQUIRED',
          data: {
            current_tier: 'free',
            required_tier: 'premium',
            feature: options.feature,
            upgrade_url: '/api/v1/subscription/upgrade',
            upgrade_message: `Upgrade to Premium to access ${options.feature} features`,
          },
        });
      }

      // Validate feature access if feature is specified
      if (options.feature) {
        const featureValidation = await tierFeatureService.validateFeatureAccess(
          user.id,
          options.feature,
          tierStatus.subscription_plan
        );

        if (!featureValidation.access_granted) {
          if (!featureValidation.feature_available) {
            return res.status(403).json({
              status: 403,
              message: 'Feature not available for your tier',
              error: 'FEATURE_NOT_AVAILABLE',
              data: {
                feature: options.feature,
                current_tier: tierStatus.subscription_plan,
                upgrade_url: '/api/v1/subscription/upgrade',
                upgrade_message: `Upgrade to Premium to access ${options.feature} features`,
              },
            });
          }

          if (!featureValidation.usage_within_limits) {
            return res.status(403).json({
              status: 403,
              message: 'Usage limit exceeded',
              error: 'USAGE_LIMIT_EXCEEDED',
              data: {
                feature: options.feature,
                current_usage: featureValidation.current_usage,
                limit: featureValidation.limit,
                upgrade_url: '/api/v1/subscription/upgrade',
                upgrade_message: `Upgrade to Premium for unlimited ${options.feature}`,
              },
            });
          }
        }
      }

      // If all validations pass, continue to next middleware
      return next();
    } catch (error) {
      logger.error('Error in tier validation middleware:', error);
      const message = 'Internal server error during tier validation';
      const code = 'TIER_VALIDATION_ERROR';
      if (typeof error === 'object' && error !== null && 'message' in error) {
        if ((error as any).message === 'User not found') {
          return res.status(401).json({
            status: 401,
            message: 'User not found',
            error: 'UNAUTHORIZED',
          });
        }
      }
      return res.status(500).json({
        status: 500,
        message,
        error: code,
      });
    }
  };
}
