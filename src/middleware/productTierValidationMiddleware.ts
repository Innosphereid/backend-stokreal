import { Request, Response, NextFunction } from 'express';
import { TierValidationService } from '../services/TierValidationService';
import { logger } from '../utils/logger';
import { AuthenticatedRequest, JWTUser } from '../types/jwt';

export interface ProductTierValidationOptions {
  action: 'create' | 'update' | 'delete';
  skipUsageCheck?: boolean;
}

/**
 * Middleware for validating product tier limits
 */
export function productTierValidationMiddleware(options: ProductTierValidationOptions) {
  const tierValidationService = new TierValidationService();

  return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      const user = authenticatedReq.user as JWTUser;

      if (!user?.id) {
        return res.status(401).json({
          status: 401,
          message: 'User not authenticated',
          error: 'UNAUTHORIZED',
        });
      }

      // Only validate creation limits
      if (options.action === 'create') {
        const validation = await tierValidationService.validateProductCreation(user.id);

        if (!validation.canProceed) {
          return res.status(403).json({
            status: 403,
            message: validation.reason || 'Product creation limit reached',
            error: 'TIER_LIMIT_EXCEEDED',
            data: {
              current_tier: validation.currentTier,
              feature: validation.feature,
              current_usage: validation.currentUsage,
              limit: validation.limit,
              remaining: validation.remaining,
              upgrade_prompt: validation.upgradePrompt,
            },
          });
        }

        // Add warning headers if approaching limit
        if (validation.warning) {
          res.set('X-Tier-Warning', validation.warning);
        }
        if (validation.upgradePrompt) {
          res.set('X-Tier-Upgrade-Prompt', validation.upgradePrompt);
        }
      }

      // Continue to next middleware
      next();
    } catch (error) {
      logger.error('Error in product tier validation middleware:', error);
      return res.status(500).json({
        status: 500,
        message: 'Internal server error during tier validation',
        error: 'TIER_VALIDATION_ERROR',
      });
    }
  };
}

/**
 * Middleware for validating category tier limits
 */
export function categoryTierValidationMiddleware(options: ProductTierValidationOptions) {
  const tierValidationService = new TierValidationService();

  return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      const user = authenticatedReq.user as JWTUser;

      if (!user?.id) {
        return res.status(401).json({
          status: 401,
          message: 'User not authenticated',
          error: 'UNAUTHORIZED',
        });
      }

      // Only validate creation limits
      if (options.action === 'create') {
        const validation = await tierValidationService.validateCategoryCreation(user.id);

        if (!validation.canProceed) {
          return res.status(403).json({
            status: 403,
            message: validation.reason || 'Category creation limit reached',
            error: 'TIER_LIMIT_EXCEEDED',
            data: {
              current_tier: validation.currentTier,
              feature: validation.feature,
              current_usage: validation.currentUsage,
              limit: validation.limit,
              remaining: validation.remaining,
              upgrade_prompt: validation.upgradePrompt,
            },
          });
        }

        // Add warning headers if approaching limit
        if (validation.warning) {
          res.set('X-Tier-Warning', validation.warning);
        }
        if (validation.upgradePrompt) {
          res.set('X-Tier-Upgrade-Prompt', validation.upgradePrompt);
        }
      }

      // Continue to next middleware
      next();
    } catch (error) {
      logger.error('Error in category tier validation middleware:', error);
      return res.status(500).json({
        status: 500,
        message: 'Internal server error during tier validation',
        error: 'TIER_VALIDATION_ERROR',
      });
    }
  };
}
