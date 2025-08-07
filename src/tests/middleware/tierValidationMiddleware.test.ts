import { Request, Response, NextFunction } from 'express';
import { tierValidationMiddleware } from '../../middleware/tierValidationMiddleware';
import { TierService } from '../../services/TierService';
import { TierFeatureService } from '../../services/TierFeatureService';
import { SubscriptionPlan } from '../../types';

// Mock the services
jest.mock('../../services/TierService');
jest.mock('../../services/TierFeatureService');

const mockTierService = TierService as jest.MockedClass<typeof TierService>;
const mockTierFeatureService = TierFeatureService as jest.MockedClass<typeof TierFeatureService>;

// Helper functions to create proper mock objects
function createMockTierStatus(overrides: Partial<any> = {}) {
  return {
    user_id: 'user-123',
    subscription_plan: 'premium' as SubscriptionPlan,
    subscription_expires_at: null,
    is_active: true,
    days_until_expiration: null,
    grace_period_active: false,
    grace_period_expires_at: null,
    tier_features: {},
    current_usage: {},
    ...overrides,
  };
}

function createMockFeatureValidationResult(overrides: Partial<any> = {}) {
  return {
    access_granted: true,
    feature_available: true,
    usage_within_limits: true,
    current_usage: 0,
    limit: null,
    ...overrides,
  };
}

describe('tierValidationMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockRequest = {
      headers: {
        authorization: 'Bearer valid-jwt-token',
      },
      user: {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user',
      },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('JWT token extraction and user validation', () => {
    it('should call next() when valid JWT token is provided', async () => {
      // Arrange
      const middleware = tierValidationMiddleware({
        requiredTier: 'premium',
        feature: 'analytics_access',
      });

      mockTierService.prototype.getUserTierStatus.mockResolvedValue(
        createMockTierStatus()
      );

      mockTierFeatureService.prototype.validateFeatureAccess.mockResolvedValue(
        createMockFeatureValidationResult()
      );

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 401 when no authorization header is provided', async () => {
      // Arrange
      mockRequest.headers = {};
      const middleware = tierValidationMiddleware({
        requiredTier: 'premium',
        feature: 'analytics_access',
      });

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 401,
        message: 'Authorization header required',
        error: 'UNAUTHORIZED',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when invalid JWT token format is provided', async () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'InvalidTokenFormat',
      };
      const middleware = tierValidationMiddleware({
        requiredTier: 'premium',
        feature: 'analytics_access',
      });

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 401,
        message: 'Invalid authorization header format',
        error: 'UNAUTHORIZED',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('subscription status checking', () => {
    it('should allow access for premium user accessing premium feature', async () => {
      // Arrange
      const middleware = tierValidationMiddleware({
        requiredTier: 'premium',
        feature: 'analytics_access',
      });

      mockTierService.prototype.getUserTierStatus.mockResolvedValue(
        createMockTierStatus()
      );

      mockTierFeatureService.prototype.validateFeatureAccess.mockResolvedValue(
        createMockFeatureValidationResult()
      );

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should allow access for free user accessing free feature', async () => {
      // Arrange
      const middleware = tierValidationMiddleware({
        requiredTier: 'free',
        feature: 'basic_analytics',
      });

      mockTierService.prototype.getUserTierStatus.mockResolvedValue(
        createMockTierStatus({ subscription_plan: 'free' })
      );

      mockTierFeatureService.prototype.validateFeatureAccess.mockResolvedValue(
        createMockFeatureValidationResult()
      );

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny access for free user accessing premium feature', async () => {
      // Arrange
      const middleware = tierValidationMiddleware({
        requiredTier: 'premium',
        feature: 'advanced_analytics',
      });

      mockTierService.prototype.getUserTierStatus.mockResolvedValue(
        createMockTierStatus({ subscription_plan: 'free' })
      );

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 403,
        message: 'Insufficient tier privileges',
        error: 'TIER_UPGRADE_REQUIRED',
        data: {
          current_tier: 'free',
          required_tier: 'premium',
          feature: 'advanced_analytics',
          upgrade_url: '/api/v1/subscription/upgrade',
          upgrade_message: 'Upgrade to Premium to access advanced_analytics features',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow access for premium user in grace period', async () => {
      // Arrange
      const middleware = tierValidationMiddleware({
        requiredTier: 'premium',
        feature: 'analytics_access',
      });

      mockTierService.prototype.getUserTierStatus.mockResolvedValue(
        createMockTierStatus({
          grace_period_active: true,
          grace_period_expires_at: new Date('2025-12-31T23:59:59Z'),
        })
      );

      mockTierFeatureService.prototype.validateFeatureAccess.mockResolvedValue(
        createMockFeatureValidationResult()
      );

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should allow access for premium user without feature validation', async () => {
      // Arrange
      const middleware = tierValidationMiddleware({
        requiredTier: 'premium',
      });

      mockTierService.prototype.getUserTierStatus.mockResolvedValue(
        createMockTierStatus()
      );

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('feature validation', () => {
    it('should deny access when feature is not available for tier', async () => {
      // Arrange
      const middleware = tierValidationMiddleware({
        requiredTier: 'free',
        feature: 'premium_feature',
      });

      mockTierService.prototype.getUserTierStatus.mockResolvedValue(
        createMockTierStatus({ subscription_plan: 'free' })
      );

      mockTierFeatureService.prototype.validateFeatureAccess.mockResolvedValue(
        createMockFeatureValidationResult({
          access_granted: false,
          feature_available: false,
          usage_within_limits: false,
          reason: 'feature_not_available',
        })
      );

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 403,
        message: 'Feature not available for your tier',
        error: 'FEATURE_NOT_AVAILABLE',
        data: {
          feature: 'premium_feature',
          current_tier: 'free',
          upgrade_url: '/api/v1/subscription/upgrade',
          upgrade_message: 'Upgrade to Premium to access premium_feature features',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access when usage limit is exceeded', async () => {
      // Arrange
      const middleware = tierValidationMiddleware({
        requiredTier: 'free',
        feature: 'api_calls',
      });

      mockTierService.prototype.getUserTierStatus.mockResolvedValue(
        createMockTierStatus({ subscription_plan: 'free' })
      );

      mockTierFeatureService.prototype.validateFeatureAccess.mockResolvedValue(
        createMockFeatureValidationResult({
          access_granted: false,
          feature_available: true,
          usage_within_limits: false,
          current_usage: 1000,
          limit: 500,
        })
      );

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 403,
        message: 'Usage limit exceeded',
        error: 'USAGE_LIMIT_EXCEEDED',
        data: {
          feature: 'api_calls',
          current_usage: 1000,
          limit: 500,
          upgrade_url: '/api/v1/subscription/upgrade',
          upgrade_message: 'Upgrade to Premium for unlimited api_calls',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should return 401 when user not found', async () => {
      // Arrange
      const middleware = tierValidationMiddleware({
        requiredTier: 'premium',
      });

      mockTierService.prototype.getUserTierStatus.mockRejectedValue(
        new Error('User not found')
      );

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 401,
        message: 'User not found',
        error: 'UNAUTHORIZED',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 500 when unexpected error occurs', async () => {
      // Arrange
      const middleware = tierValidationMiddleware({
        requiredTier: 'premium',
      });

      mockTierService.prototype.getUserTierStatus.mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 500,
        message: 'Internal server error during tier validation',
        error: 'TIER_VALIDATION_ERROR',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when user information is missing', async () => {
      // Arrange
      delete mockRequest.user;
      const middleware = tierValidationMiddleware({
        requiredTier: 'premium',
      });

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 401,
        message: 'Invalid or missing user information',
        error: 'UNAUTHORIZED',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
