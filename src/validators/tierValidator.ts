import { logger } from '@/utils/logger';
import { SubscriptionPlan } from '@/types';
import {
  InternalTierValidationRequest,
  FeatureAvailabilityQuery,
  UsageStatisticsQuery,
} from '@/types/tier';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Tier Validator - Handles validation for tier-related API requests
 */
export class TierValidator {
  /**
   * Validate feature availability query parameters
   */
  static validateFeatureAvailabilityQuery(query: any): ValidationResult {
    const errors: ValidationError[] = [];
    const sanitizedQuery: FeatureAvailabilityQuery = {};

    try {
      // Validate feature parameter (optional)
      if (query.feature !== undefined) {
        if (typeof query.feature !== 'string') {
          errors.push({ field: 'feature', message: 'Feature must be a string' });
        } else if (query.feature.trim().length === 0) {
          errors.push({ field: 'feature', message: 'Feature cannot be empty' });
        } else if (query.feature.length > 100) {
          errors.push({
            field: 'feature',
            message: 'Feature name must be less than 100 characters',
          });
        } else {
          sanitizedQuery.feature = query.feature.trim();
        }
      }

      // Validate action parameter (optional)
      if (query.action !== undefined) {
        if (typeof query.action !== 'string') {
          errors.push({ field: 'action', message: 'Action must be a string' });
        } else if (query.action.trim().length === 0) {
          errors.push({ field: 'action', message: 'Action cannot be empty' });
        } else if (query.action.length > 100) {
          errors.push({ field: 'action', message: 'Action name must be less than 100 characters' });
        } else {
          sanitizedQuery.action = query.action.trim();
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      logger.error('Feature availability query validation error:', error);
      return {
        isValid: false,
        errors: [{ field: 'general', message: 'Validation failed due to unexpected error' }],
      };
    }
  }

  /**
   * Validate usage statistics query parameters
   */
  static validateUsageStatisticsQuery(query: any): ValidationResult {
    const errors: ValidationError[] = [];
    const sanitizedQuery: UsageStatisticsQuery = {};

    try {
      // Validate period parameter (optional, default to 'daily')
      if (query.period !== undefined) {
        if (typeof query.period !== 'string') {
          errors.push({ field: 'period', message: 'Period must be a string' });
        } else {
          const validPeriods = ['daily', 'weekly', 'monthly'];
          const period = query.period.toLowerCase().trim();

          if (!validPeriods.includes(period)) {
            errors.push({
              field: 'period',
              message: 'Period must be one of: daily, weekly, monthly',
            });
          } else {
            sanitizedQuery.period = period as 'daily' | 'weekly' | 'monthly';
          }
        }
      } else {
        sanitizedQuery.period = 'daily';
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      logger.error('Usage statistics query validation error:', error);
      return {
        isValid: false,
        errors: [{ field: 'general', message: 'Validation failed due to unexpected error' }],
      };
    }
  }

  /**
   * Validate internal tier validation request
   */
  static validateInternalTierValidationRequest(data: any): ValidationResult {
    const errors: ValidationError[] = [];

    try {
      // Validate user_id (required)
      if (!data.user_id) {
        errors.push({ field: 'user_id', message: 'User ID is required' });
      } else if (typeof data.user_id !== 'string') {
        errors.push({ field: 'user_id', message: 'User ID must be a string' });
      } else if (data.user_id.trim().length === 0) {
        errors.push({ field: 'user_id', message: 'User ID cannot be empty' });
      } else if (!this.isValidUUID(data.user_id)) {
        errors.push({ field: 'user_id', message: 'User ID must be a valid UUID' });
      }

      // Validate required_tier (required)
      if (!data.required_tier) {
        errors.push({ field: 'required_tier', message: 'Required tier is required' });
      } else if (typeof data.required_tier !== 'string') {
        errors.push({ field: 'required_tier', message: 'Required tier must be a string' });
      } else {
        const validTiers: SubscriptionPlan[] = ['free', 'premium'];
        if (!validTiers.includes(data.required_tier as SubscriptionPlan)) {
          errors.push({
            field: 'required_tier',
            message: 'Required tier must be either "free" or "premium"',
          });
        }
      }

      // Validate feature (required)
      if (!data.feature) {
        errors.push({ field: 'feature', message: 'Feature is required' });
      } else if (typeof data.feature !== 'string') {
        errors.push({ field: 'feature', message: 'Feature must be a string' });
      } else if (data.feature.trim().length === 0) {
        errors.push({ field: 'feature', message: 'Feature cannot be empty' });
      } else if (data.feature.length > 100) {
        errors.push({ field: 'feature', message: 'Feature name must be less than 100 characters' });
      }

      // Validate action (required)
      if (!data.action) {
        errors.push({ field: 'action', message: 'Action is required' });
      } else if (typeof data.action !== 'string') {
        errors.push({ field: 'action', message: 'Action must be a string' });
      } else if (data.action.trim().length === 0) {
        errors.push({ field: 'action', message: 'Action cannot be empty' });
      } else if (data.action.length > 100) {
        errors.push({ field: 'action', message: 'Action name must be less than 100 characters' });
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      logger.error('Internal tier validation request validation error:', error);
      return {
        isValid: false,
        errors: [{ field: 'general', message: 'Validation failed due to unexpected error' }],
      };
    }
  }

  /**
   * Validate bulk tier validation request
   */
  static validateBulkTierValidationRequest(data: any): ValidationResult {
    const errors: ValidationError[] = [];

    try {
      // Validate requests array
      if (!data.requests) {
        errors.push({ field: 'requests', message: 'Requests array is required' });
        return { isValid: false, errors };
      }

      if (!Array.isArray(data.requests)) {
        errors.push({ field: 'requests', message: 'Requests must be an array' });
        return { isValid: false, errors };
      }

      if (data.requests.length === 0) {
        errors.push({ field: 'requests', message: 'Requests array cannot be empty' });
        return { isValid: false, errors };
      }

      if (data.requests.length > 100) {
        errors.push({
          field: 'requests',
          message: 'Maximum 100 requests allowed per bulk operation',
        });
        return { isValid: false, errors };
      }

      // Validate each request in the array
      data.requests.forEach((request: any, index: number) => {
        const requestValidation = this.validateInternalTierValidationRequest(request);
        if (!requestValidation.isValid) {
          requestValidation.errors.forEach(error => {
            errors.push({
              field: `requests[${index}].${error.field}`,
              message: error.message,
            });
          });
        }
      });

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      logger.error('Bulk tier validation request validation error:', error);
      return {
        isValid: false,
        errors: [{ field: 'general', message: 'Validation failed due to unexpected error' }],
      };
    }
  }

  /**
   * Sanitize feature availability query
   */
  static sanitizeFeatureAvailabilityQuery(query: any): FeatureAvailabilityQuery {
    const sanitized: FeatureAvailabilityQuery = {};

    if (query.feature && typeof query.feature === 'string') {
      sanitized.feature = query.feature.trim();
    }

    if (query.action && typeof query.action === 'string') {
      sanitized.action = query.action.trim();
    }

    return sanitized;
  }

  /**
   * Sanitize usage statistics query
   */
  static sanitizeUsageStatisticsQuery(query: any): UsageStatisticsQuery {
    const sanitized: UsageStatisticsQuery = {};

    if (query.period && typeof query.period === 'string') {
      const period = query.period.toLowerCase().trim();
      if (['daily', 'weekly', 'monthly'].includes(period)) {
        sanitized.period = period as 'daily' | 'weekly' | 'monthly';
      }
    }

    if (!sanitized.period) {
      sanitized.period = 'daily';
    }

    return sanitized;
  }

  /**
   * Sanitize internal tier validation request
   */
  static sanitizeInternalTierValidationRequest(data: any): InternalTierValidationRequest {
    return {
      user_id: typeof data.user_id === 'string' ? data.user_id.trim() : '',
      required_tier:
        typeof data.required_tier === 'string'
          ? (data.required_tier.trim() as SubscriptionPlan)
          : 'free',
      feature: typeof data.feature === 'string' ? data.feature.trim() : '',
      action: typeof data.action === 'string' ? data.action.trim() : '',
    };
  }

  /**
   * Check if string is a valid UUID
   */
  private static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Validate feature name format
   */
  static isValidFeatureName(feature: string): boolean {
    // Feature names should be alphanumeric with underscores and hyphens
    const featureNameRegex = /^[a-zA-Z0-9_-]+$/;
    return featureNameRegex.test(feature) && feature.length <= 100;
  }

  /**
   * Validate action name format
   */
  static isValidActionName(action: string): boolean {
    // Action names should be alphanumeric with underscores and hyphens
    const actionNameRegex = /^[a-zA-Z0-9_-]+$/;
    return actionNameRegex.test(action) && action.length <= 100;
  }

  /**
   * Get validation error messages for common scenarios
   */
  static getCommonErrorMessages() {
    return {
      INVALID_UUID: 'Invalid UUID format',
      INVALID_TIER: 'Tier must be either "free" or "premium"',
      FEATURE_REQUIRED: 'Feature name is required',
      ACTION_REQUIRED: 'Action name is required',
      INVALID_PERIOD: 'Period must be one of: daily, weekly, monthly',
      ARRAY_TOO_LARGE: 'Array size exceeds maximum allowed limit',
      EMPTY_ARRAY: 'Array cannot be empty',
      INVALID_FORMAT: 'Invalid format or data type',
    };
  }
}
