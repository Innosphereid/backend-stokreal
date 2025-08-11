import { Request, Response, NextFunction } from 'express';
import { TierService } from '../services/TierService';
import { TierFeatureService } from '../services/TierFeatureService';
import { logger } from '../utils/logger';
import { AuthenticatedRequest, JWTUser } from '../types/jwt';

export interface TierValidationOptions {
  requiredTier: 'free' | 'premium';
  feature?: string;
  action?: string;
  skipUsageCheck?: boolean;
}

interface ValidationError {
  status: number;
  message: string;
  error: string;
  data?: Record<string, unknown>;
}

/**
 * Validates authorization header format
 */
function validateAuthHeader(authHeader: string | undefined): ValidationError | null {
  if (!authHeader) {
    return {
      status: 401,
      message: 'Authorization header required',
      error: 'UNAUTHORIZED',
    };
  }

  const tokenParts = authHeader.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    return {
      status: 401,
      message: 'Invalid authorization header format',
      error: 'UNAUTHORIZED',
    };
  }

  return null;
}

/**
 * Validates user information from request
 */
function validateUser(req: Request): ValidationError | null {
  const authenticatedReq = req as AuthenticatedRequest;
  const user = authenticatedReq.user;

  if (!user?.id) {
    return {
      status: 401,
      message: 'Invalid or missing user information',
      error: 'UNAUTHORIZED',
    };
  }

  return null;
}

/**
 * Checks subscription tier requirements
 */
function checkSubscriptionTier(
  requiredTier: string,
  currentTier: string,
  feature?: string
): ValidationError | null {
  if (requiredTier === 'premium' && currentTier === 'free') {
    return {
      status: 403,
      message: 'Insufficient tier privileges',
      error: 'TIER_UPGRADE_REQUIRED',
      data: {
        current_tier: 'free',
        required_tier: 'premium',
        feature,
        upgrade_url: '/api/v1/subscription/upgrade',
        upgrade_message: `Upgrade to Premium to access ${feature} features`,
      },
    };
  }

  return null;
}

/**
 * Validates feature access and usage limits
 */
async function validateFeatureAccess(
  tierFeatureService: TierFeatureService,
  userId: string,
  feature: string,
  subscriptionPlan: string
): Promise<ValidationError | null> {
  const featureValidation = await tierFeatureService.validateFeatureAccess(
    userId,
    feature,
    subscriptionPlan
  );

  if (!featureValidation.access_granted) {
    if (!featureValidation.feature_available) {
      return {
        status: 403,
        message: 'Feature not available for your tier',
        error: 'FEATURE_NOT_AVAILABLE',
        data: {
          feature,
          current_tier: subscriptionPlan,
          upgrade_url: '/api/v1/subscription/upgrade',
          upgrade_message: `Upgrade to Premium to access ${feature} features`,
        },
      };
    }

    if (!featureValidation.usage_within_limits) {
      return {
        status: 403,
        message: 'Usage limit exceeded',
        error: 'USAGE_LIMIT_EXCEEDED',
        data: {
          feature,
          current_usage: featureValidation.current_usage,
          limit: featureValidation.limit,
          upgrade_url: '/api/v1/subscription/upgrade',
          upgrade_message: `Upgrade to Premium for unlimited ${feature}`,
        },
      };
    }
  }

  return null;
}

/**
 * Handles error responses with proper typing
 */
function handleErrorResponse(error: unknown): ValidationError {
  logger.error('Error in tier validation middleware:', error);

  if (error && typeof error === 'object' && 'message' in error) {
    const errorMessage = (error as { message: string }).message;
    if (errorMessage === 'User not found') {
      return {
        status: 401,
        message: 'User not found',
        error: 'UNAUTHORIZED',
      };
    }
  }

  return {
    status: 500,
    message: 'Internal server error during tier validation',
    error: 'TIER_VALIDATION_ERROR',
  };
}

/**
 * Middleware factory for tier validation
 */
export function tierValidationMiddleware(options: TierValidationOptions) {
  const tierService = new TierService();
  const tierFeatureService = new TierFeatureService();

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate authorization header
      const authError = validateAuthHeader(req.headers.authorization);
      if (authError) {
        return res.status(authError.status).json(authError);
      }

      // Validate user information
      const userError = validateUser(req);
      if (userError) {
        return res.status(userError.status).json(userError);
      }

      const authenticatedReq = req as AuthenticatedRequest;
      const user = authenticatedReq.user as JWTUser;

      // Get user tier status
      const tierStatus = await tierService.getUserTierStatus(user.id);

      // Check subscription tier requirements
      const tierError = checkSubscriptionTier(
        options.requiredTier,
        tierStatus.subscription_plan,
        options.feature
      );
      if (tierError) {
        return res.status(tierError.status).json(tierError);
      }

      // Validate feature access if feature is specified
      if (options.feature) {
        const featureError = await validateFeatureAccess(
          tierFeatureService,
          user.id,
          options.feature,
          tierStatus.subscription_plan
        );
        if (featureError) {
          return res.status(featureError.status).json(featureError);
        }
      }

      // If all validations pass, continue to next middleware
      return next();
    } catch (error) {
      const errorResponse = handleErrorResponse(error);
      return res.status(errorResponse.status).json(errorResponse);
    }
  };
}
