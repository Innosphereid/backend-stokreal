import { Request, Response } from 'express';
import { TierService } from '@/services/TierService';
import { TierFeatureService } from '@/services/TierFeatureService';
import { AuditLogService } from '@/services/AuditLogService';
import { createSuccessResponse } from '@/utils/response';
import { asyncHandler } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';
import { createError, formatValidationErrorResponse } from '@/utils/errors';
import {
  InternalTierValidationRequest,
  InternalTierValidationResponse,
  TierValidationErrorResponse,
} from '@/types/tier';

/**
 * Controller for internal tier validation API endpoints
 * Used for service-to-service communication and tier validation
 */
export class InternalTierController {
  private readonly tierService: TierService;
  private readonly tierFeatureService: TierFeatureService;
  private readonly auditLogService: AuditLogService;

  constructor() {
    this.tierService = new TierService();
    this.tierFeatureService = new TierFeatureService();
    this.auditLogService = new AuditLogService();
  }

  /**
   * Validate tier access for internal services
   * POST /api/v1/internal/validate-tier
   */
  validateTier = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    logger.info('Internal tier validation request received', {
      endpoint: 'validate-tier',
      body: req.body,
    });

    const validationRequest = req.body as InternalTierValidationRequest;

    // Validate required fields
    if (
      !validationRequest.user_id ||
      !validationRequest.required_tier ||
      !validationRequest.feature
    ) {
      const errors = [];
      if (!validationRequest.user_id)
        errors.push({ field: 'user_id', message: 'User ID is required' });
      if (!validationRequest.required_tier)
        errors.push({ field: 'required_tier', message: 'Required tier is required' });
      if (!validationRequest.feature)
        errors.push({ field: 'feature', message: 'Feature is required' });

      const errorResponse = formatValidationErrorResponse('Validation failed', errors);
      logger.warn('Tier validation failed - missing required fields', {
        endpoint: 'validate-tier',
        errors,
        response: errorResponse,
      });
      res.status(400).json(errorResponse);
      return;
    }

    try {
      // Get user tier status
      const tierStatus = await this.tierService.getUserTierStatus(validationRequest.user_id);

      // Check if user exists and is active
      if (!tierStatus.is_active) {
        await this.auditLogService.log({
          userId: validationRequest.user_id,
          action: 'tier_validation_failed',
          resource: 'internal_tier_validation',
          details: {
            reason: 'user_inactive',
            feature: validationRequest.feature,
            required_tier: validationRequest.required_tier,
            current_tier: tierStatus.subscription_plan,
          },
        });

        res.status(403).json({
          status: 403,
          message: 'User account is inactive',
          error: 'USER_INACTIVE',
          data: {
            current_tier: tierStatus.subscription_plan,
            required_tier: validationRequest.required_tier,
            feature: validationRequest.feature,
            upgrade_url: '/api/v1/subscription/upgrade',
            upgrade_message: 'Please reactivate your account to continue',
          },
        });
        return;
      }

      // Validate feature access
      const featureValidation = await this.tierFeatureService.validateFeatureAccess(
        validationRequest.user_id,
        validationRequest.feature,
        tierStatus.subscription_plan
      );

      // Check tier requirements
      const tierSufficient = this.checkTierRequirement(
        validationRequest.required_tier,
        tierStatus.subscription_plan
      );

      const accessGranted = tierSufficient && featureValidation.access_granted;

      if (accessGranted) {
        // Log successful validation
        await this.auditLogService.log({
          userId: validationRequest.user_id,
          action: 'tier_validation_success',
          resource: 'internal_tier_validation',
          details: {
            feature: validationRequest.feature,
            action: validationRequest.action,
            current_tier: tierStatus.subscription_plan,
            required_tier: validationRequest.required_tier,
          },
        });

        const responseData: InternalTierValidationResponse = {
          user_id: validationRequest.user_id,
          current_tier: tierStatus.subscription_plan,
          access_granted: true,
          feature_available: featureValidation.feature_available,
          usage_within_limits: featureValidation.usage_within_limits,
          tier_info: {
            subscription_expires_at: tierStatus.subscription_expires_at,
            grace_period_active: tierStatus.grace_period_active,
          },
        };

        const successResponse = createSuccessResponse('Tier validation successful', responseData);

        logger.info(
          `Tier validation successful for user ${validationRequest.user_id}, feature ${validationRequest.feature}`,
          { endpoint: 'validate-tier', response: successResponse }
        );
        res.status(200).json(successResponse);
      } else {
        // Log failed validation
        await this.auditLogService.log({
          userId: validationRequest.user_id,
          action: 'tier_validation_failed',
          resource: 'internal_tier_validation',
          details: {
            reason: !tierSufficient ? 'insufficient_tier' : 'feature_limit_exceeded',
            feature: validationRequest.feature,
            action: validationRequest.action,
            current_tier: tierStatus.subscription_plan,
            required_tier: validationRequest.required_tier,
            current_usage: featureValidation.current_usage,
            limit: featureValidation.limit,
          },
        });

        // Determine error message and upgrade message
        let errorMessage = 'Insufficient tier privileges';
        let upgradeMessage = `Upgrade to Premium to access ${validationRequest.feature} features`;

        if (!featureValidation.feature_available) {
          errorMessage = 'Feature not available for your tier';
        } else if (!featureValidation.usage_within_limits) {
          errorMessage = 'Usage limit exceeded';
          upgradeMessage = `Upgrade to Premium for unlimited ${validationRequest.feature}`;
        }

        const errorData: TierValidationErrorResponse = {
          current_tier: tierStatus.subscription_plan,
          required_tier: validationRequest.required_tier,
          feature: validationRequest.feature,
          upgrade_url: '/api/v1/subscription/upgrade',
          upgrade_message: upgradeMessage,
        };

        const failedResponse = {
          status: 403,
          message: errorMessage,
          error: 'TIER_UPGRADE_REQUIRED',
          data: errorData,
        };

        logger.warn(
          `Tier validation failed for user ${validationRequest.user_id}, feature ${validationRequest.feature}: ${errorMessage}`,
          { endpoint: 'validate-tier', response: failedResponse }
        );

        res.status(403).json(failedResponse);
      }
    } catch (error) {
      logger.error(`Internal tier validation failed for user ${validationRequest.user_id}:`, error);

      // Log the error
      await this.auditLogService.log({
        userId: validationRequest.user_id,
        action: 'tier_validation_error',
        resource: 'internal_tier_validation',
        details: {
          feature: validationRequest.feature,
          action: validationRequest.action,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw createError('Internal server error during tier validation', 500);
    }
  });

  /**
   * Bulk tier validation for multiple users/features
   * POST /api/v1/internal/validate-tier-bulk
   */
  validateTierBulk = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    logger.info('Bulk tier validation request received', {
      endpoint: 'validate-tier-bulk',
      requestCount: req.body.requests?.length || 0,
      body: req.body,
    });

    const requests = req.body.requests as InternalTierValidationRequest[];

    if (!Array.isArray(requests) || requests.length === 0) {
      res
        .status(400)
        .json(
          formatValidationErrorResponse('Validation failed', [
            { field: 'requests', message: 'Requests array is required and cannot be empty' },
          ])
        );
      return;
    }

    if (requests.length > 100) {
      res
        .status(400)
        .json(
          formatValidationErrorResponse('Validation failed', [
            { field: 'requests', message: 'Maximum 100 requests allowed per bulk operation' },
          ])
        );
      return;
    }

    try {
      const results: Array<{
        user_id: string;
        feature: string;
        validation: InternalTierValidationResponse | { error: string; message: string };
      }> = [];

      // Process each validation request
      for (const validationRequest of requests) {
        try {
          // Validate required fields
          if (
            !validationRequest.user_id ||
            !validationRequest.required_tier ||
            !validationRequest.feature
          ) {
            results.push({
              user_id: validationRequest.user_id || 'unknown',
              feature: validationRequest.feature || 'unknown',
              validation: {
                error: 'VALIDATION_ERROR',
                message: 'Missing required fields',
              },
            });
            continue;
          }

          // Get user tier status
          const tierStatus = await this.tierService.getUserTierStatus(validationRequest.user_id);

          // Validate feature access
          const featureValidation = await this.tierFeatureService.validateFeatureAccess(
            validationRequest.user_id,
            validationRequest.feature,
            tierStatus.subscription_plan
          );

          // Check tier requirements
          const tierSufficient = this.checkTierRequirement(
            validationRequest.required_tier,
            tierStatus.subscription_plan
          );

          const accessGranted =
            tierSufficient && featureValidation.access_granted && tierStatus.is_active;

          const validationResult: InternalTierValidationResponse = {
            user_id: validationRequest.user_id,
            current_tier: tierStatus.subscription_plan,
            access_granted: accessGranted,
            feature_available: featureValidation.feature_available,
            usage_within_limits: featureValidation.usage_within_limits,
            tier_info: {
              subscription_expires_at: tierStatus.subscription_expires_at,
              grace_period_active: tierStatus.grace_period_active,
            },
          };

          results.push({
            user_id: validationRequest.user_id,
            feature: validationRequest.feature,
            validation: validationResult,
          });
        } catch (error) {
          logger.error(`Bulk validation failed for user ${validationRequest.user_id}:`, error);

          results.push({
            user_id: validationRequest.user_id || 'unknown',
            feature: validationRequest.feature || 'unknown',
            validation: {
              error: 'INTERNAL_ERROR',
              message: 'Validation failed due to internal error',
            },
          });
        }
      }

      const successResponse = createSuccessResponse('Bulk tier validation completed', {
        results,
        total: results.length,
      });

      logger.info(`Bulk tier validation completed for ${results.length} requests`, {
        endpoint: 'validate-tier-bulk',
        totalRequests: results.length,
        response: successResponse,
      });
      res.status(200).json(successResponse);
    } catch (error) {
      logger.error('Bulk tier validation failed:', error);
      throw createError('Bulk tier validation failed', 500);
    }
  });

  /**
   * Check if current tier meets requirement
   */
  private checkTierRequirement(requiredTier: string, currentTier: string): boolean {
    if (requiredTier === 'free') {
      return true; // Free tier is accessible to everyone
    }

    if (requiredTier === 'premium') {
      return currentTier === 'premium';
    }

    return false;
  }
}
