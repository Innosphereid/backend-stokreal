import { Request, Response, NextFunction } from 'express';
import { tierValidationMiddleware } from '../../middleware/tierValidationMiddleware';
import { TierService } from '../../services/TierService';
import { TierFeatureService } from '../../services/TierFeatureService';

// Mock dependencies
jest.mock('../../services/TierService');
jest.mock('../../services/TierFeatureService');
jest.mock('../../utils/logger');

const mockTierService = TierService as jest.MockedClass<typeof TierService>;
const mockTierFeatureService = TierFeatureService as jest.MockedClass<typeof TierFeatureService>;

describe('tierValidationMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      headers: {
        authorization: 'Bearer valid-jwt-token',
      },
      user: {
        id: 'user-123',
        email: 'test@example.com',
      },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('JWT token extraction and user validation', () => {
    it('should call next() when valid JWT token is provided', async () => {
      // Arrange
      const middleware = tierValidationMiddleware({
        requiredTier: 'premium',
        feature: 'analytics_access',
      });

      mockTierService.prototype.getUserTierStatus.mockResolvedValue({
        user_id: 'user-123',
        subscription_plan: 'premium',
        is_active: true,
        grace_period_active: false,
      });

      mockTierFeatureService.prototype.validateFeatureAccess.mockResolvedValue({
        access_granted: true,
        feature_available: true,
        usage_within_limits: true,
      });

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

      mockTierService.prototype.getUserTierStatus.mockResolvedValue({
        user_id: 'user-123',
        subscription_plan: 'premium',
        is_active: true,
        grace_period_active: false,
      });

      mockTierFeatureService.prototype.validateFeatureAccess.mockResolvedValue({
        access_granted: true,
        feature_available: true,
        usage_within_limits: true,
      });

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
        feature: 'analytics_access',
      });

      mockTierService.prototype.getUserTierStatus.mockResolvedValue({
        user_id: 'user-123',
        subscription_plan: 'free',
        is_active: true,
        grace_period_active: false,
      });

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
          feature: 'analytics_access',
          upgrade_url: '/api/v1/subscription/upgrade',
          upgrade_message: 'Upgrade to Premium to access analytics_access features',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow access for expired premium user in grace period', async () => {
      // Arrange
      const middleware = tierValidationMiddleware({
        requiredTier: 'premium',
        feature: 'analytics_access',
      });

      mockTierService.prototype.getUserTierStatus.mockResolvedValue({
        user_id: 'user-123',
        subscription_plan: 'premium',
        is_active: true,
        grace_period_active: true,
        grace_period_expires_at: new Date('2025-12-31T23:59:59Z'),
      });

      mockTierFeatureService.prototype.validateFeatureAccess.mockResolvedValue({
        access_granted: true,
        feature_available: true,
        usage_within_limits: true,
      });

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('feature access validation', () => {
    it('should allow access when feature is available and within limits', async () => {
      // Arrange
      const middleware = tierValidationMiddleware({
        requiredTier: 'premium',
        feature: 'max_products',
      });

      mockTierService.prototype.getUserTierStatus.mockResolvedValue({
        user_id: 'user-123',
        subscription_plan: 'premium',
        is_active: true,
        grace_period_active: false,
      });

      mockTierFeatureService.prototype.validateFeatureAccess.mockResolvedValue({
        access_granted: true,
        feature_available: true,
        usage_within_limits: true,
      });

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny access when feature is not available', async () => {
      // Arrange
      const middleware = tierValidationMiddleware({
        requiredTier: 'premium',
        feature: 'analytics_access',
      });

      mockTierService.prototype.getUserTierStatus.mockResolvedValue({
        user_id: 'user-123',
        subscription_plan: 'free',
        is_active: true,
        grace_period_active: false,
      });

      mockTierFeatureService.prototype.validateFeatureAccess.mockResolvedValue({
        access_granted: false,
        feature_available: false,
        usage_within_limits: false,
        reason: 'feature_not_available',
      });

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 403,
        message: 'Feature not available for your tier',
        error: 'FEATURE_NOT_AVAILABLE',
        data: {
          feature: 'analytics_access',
          current_tier: 'free',
          upgrade_url: '/api/v1/subscription/upgrade',
          upgrade_message: 'Upgrade to Premium to access analytics_access features',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('usage limit enforcement', () => {
    it('should deny access when usage limit is exceeded', async () => {
      // Arrange
      const middleware = tierValidationMiddleware({
        requiredTier: 'free',
        feature: 'max_products',
      });

      mockTierService.prototype.getUserTierStatus.mockResolvedValue({
        user_id: 'user-123',
        subscription_plan: 'free',
        is_active: true,
        grace_period_active: false,
      });

      mockTierFeatureService.prototype.validateFeatureAccess.mockResolvedValue({
        access_granted: false,
        feature_available: true,
        usage_within_limits: false,
        reason: 'usage_limit_exceeded',
        current_usage: 50,
        limit: 50,
      });

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 403,
        message: 'Usage limit exceeded',
        error: 'USAGE_LIMIT_EXCEEDED',
        data: {
          feature: 'max_products',
          current_usage: 50,
          limit: 50,
          upgrade_url: '/api/v1/subscription/upgrade',
          upgrade_message: 'Upgrade to Premium for unlimited max_products',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow access when usage is within limits', async () => {
      // Arrange
      const middleware = tierValidationMiddleware({
        requiredTier: 'free',
        feature: 'max_products',
      });

      mockTierService.prototype.getUserTierStatus.mockResolvedValue({
        user_id: 'user-123',
        subscription_plan: 'free',
        is_active: true,
        grace_period_active: false,
      });

      mockTierFeatureService.prototype.validateFeatureAccess.mockResolvedValue({
        access_granted: true,
        feature_available: true,
        usage_within_limits: true,
        current_usage: 25,
        limit: 50,
      });

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should return 500 when TierService throws an error', async () => {
      // Arrange
      const middleware = tierValidationMiddleware({
        requiredTier: 'premium',
        feature: 'analytics_access',
      });

      mockTierService.prototype.getUserTierStatus.mockRejectedValue(new Error('Database error'));

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

    it('should return 500 when TierFeatureService throws an error', async () => {
      // Arrange
      const middleware = tierValidationMiddleware({
        requiredTier: 'premium',
        feature: 'analytics_access',
      });

      mockTierService.prototype.getUserTierStatus.mockResolvedValue({
        user_id: 'user-123',
        subscription_plan: 'premium',
        is_active: true,
        grace_period_active: false,
      });

      mockTierFeatureService.prototype.validateFeatureAccess.mockRejectedValue(
        new Error('Feature service error')
      );

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 500,
        message: 'Internal server error during feature validation',
        error: 'FEATURE_VALIDATION_ERROR',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('middleware configuration', () => {
    it('should create middleware with default options', () => {
      // Act
      const middleware = tierValidationMiddleware({
        requiredTier: 'premium',
        feature: 'analytics_access',
      });

      // Assert
      expect(typeof middleware).toBe('function');
    });

    it('should create middleware with custom options', () => {
      // Act
      const middleware = tierValidationMiddleware({
        requiredTier: 'free',
        feature: 'max_products',
        action: 'create',
        skipUsageCheck: true,
      });

      // Assert
      expect(typeof middleware).toBe('function');
    });
  });
});
