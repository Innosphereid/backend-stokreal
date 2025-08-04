import { Request, Response, NextFunction } from 'express';
import { JWTMiddleware, TokenExtractor } from '../../middleware/jwtMiddleware';
import { JWTUtils, TokenMissingError, TokenInvalidError } from '../../utils/jwt';
import { AuthenticatedRequest } from '../../types/jwt';

// Mock the JWT utilities
jest.mock('../../utils/jwt');
const mockJWTUtils = JWTUtils as jest.Mocked<typeof JWTUtils>;

// Mock the logger
jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('TokenExtractor', () => {
  let mockReq: Partial<Request>;

  beforeEach(() => {
    mockReq = {
      headers: {},
      cookies: {},
      signedCookies: {},
      query: {},
      body: {},
    };
  });

  describe('fromHeader', () => {
    it('should extract token from Authorization header', () => {
      mockReq.headers = { authorization: 'Bearer valid-token' };

      const result = TokenExtractor.fromHeader(mockReq as Request);

      expect(result.token).toBe('valid-token');
      expect(result.source).toBe('header');
      expect(result.error).toBeUndefined();
    });

    it('should return null when no Authorization header', () => {
      const result = TokenExtractor.fromHeader(mockReq as Request);

      expect(result.token).toBeNull();
      expect(result.source).toBeNull();
    });

    it('should return error for invalid Authorization header format', () => {
      mockReq.headers = { authorization: 'Invalid format' };

      const result = TokenExtractor.fromHeader(mockReq as Request);

      expect(result.token).toBeNull();
      expect(result.error).toBe('Authorization header must start with "Bearer "');
    });

    it('should return error for empty token in Authorization header', () => {
      mockReq.headers = { authorization: 'Bearer ' };

      const result = TokenExtractor.fromHeader(mockReq as Request);

      expect(result.token).toBeNull();
      expect(result.error).toBe('No token provided in Authorization header');
    });
  });

  describe('fromCookies', () => {
    it('should extract token from signed cookies', () => {
      mockReq.signedCookies = { jwt_access: 'signed-token' };

      const result = TokenExtractor.fromCookies(mockReq as Request);

      expect(result.token).toBe('signed-token');
      expect(result.source).toBe('cookie');
    });

    it('should fallback to regular cookies', () => {
      mockReq.cookies = { jwt_access: 'regular-token' };

      const result = TokenExtractor.fromCookies(mockReq as Request);

      expect(result.token).toBe('regular-token');
      expect(result.source).toBe('cookie');
    });

    it('should check auth_token for backward compatibility', () => {
      mockReq.signedCookies = { auth_token: 'auth-token' };

      const result = TokenExtractor.fromCookies(mockReq as Request);

      expect(result.token).toBe('auth-token');
      expect(result.source).toBe('cookie');
    });

    it('should return null when no cookies found', () => {
      const result = TokenExtractor.fromCookies(mockReq as Request);

      expect(result.token).toBeNull();
      expect(result.source).toBeNull();
    });
  });

  describe('fromQuery', () => {
    it('should extract token from query parameters', () => {
      mockReq.query = { token: 'query-token' };

      const result = TokenExtractor.fromQuery(mockReq as Request);

      expect(result.token).toBe('query-token');
      expect(result.source).toBe('query');
    });

    it('should return null when no token in query', () => {
      const result = TokenExtractor.fromQuery(mockReq as Request);

      expect(result.token).toBeNull();
      expect(result.source).toBeNull();
    });
  });

  describe('fromBody', () => {
    it('should extract token from request body', () => {
      mockReq.body = { token: 'body-token' };

      const result = TokenExtractor.fromBody(mockReq as Request);

      expect(result.token).toBe('body-token');
      expect(result.source).toBe('body');
    });

    it('should return null when no token in body', () => {
      const result = TokenExtractor.fromBody(mockReq as Request);

      expect(result.token).toBeNull();
      expect(result.source).toBeNull();
    });

    it('should return null when token is not a string', () => {
      mockReq.body = { token: 123 };

      const result = TokenExtractor.fromBody(mockReq as Request);

      expect(result.token).toBeNull();
      expect(result.source).toBeNull();
    });
  });

  describe('extractToken', () => {
    it('should extract from header first by default', () => {
      mockReq.headers = { authorization: 'Bearer header-token' };
      mockReq.signedCookies = { jwt_access: 'cookie-token' };

      const result = TokenExtractor.extractToken(mockReq as Request);

      expect(result.token).toBe('header-token');
      expect(result.source).toBe('header');
    });

    it('should fallback to cookies when header not available', () => {
      mockReq.signedCookies = { jwt_access: 'cookie-token' };

      const result = TokenExtractor.extractToken(mockReq as Request);

      expect(result.token).toBe('cookie-token');
      expect(result.source).toBe('cookie');
    });

    it('should respect custom source order', () => {
      mockReq.headers = { authorization: 'Bearer header-token' };
      mockReq.signedCookies = { jwt_access: 'cookie-token' };

      const result = TokenExtractor.extractToken(mockReq as Request, ['cookie', 'header']);

      expect(result.token).toBe('cookie-token');
      expect(result.source).toBe('cookie');
    });
  });
});

describe('JWTMiddleware', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
      cookies: {},
      signedCookies: {},
      url: '/test',
      method: 'GET',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('test-user-agent'),
    };
    mockRes = {};
    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token from header', async () => {
      mockReq.headers = { authorization: 'Bearer valid-token' };

      const mockPayload = {
        sub: '123',
        email: 'test@example.com',
        role: 'user',
        type: 'access' as const,
      };

      mockJWTUtils.verifyToken.mockReturnValue(mockPayload);
      mockJWTUtils.extractUser.mockReturnValue({
        id: '123',
        email: 'test@example.com',
        role: 'user',
      });

      const middleware = JWTMiddleware.authenticateToken();
      await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockJWTUtils.verifyToken).toHaveBeenCalledWith('valid-token');
      expect(mockReq.user).toEqual({
        id: '123',
        email: 'test@example.com',
        role: 'user',
      });
      expect(mockReq.token).toBe('valid-token');
      expect(mockReq.tokenType).toBe('access');
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should authenticate valid token from cookies', async () => {
      mockReq.signedCookies = { jwt_access: 'cookie-token' };

      const mockPayload = {
        sub: '123',
        email: 'test@example.com',
        role: 'user',
        type: 'access' as const,
      };

      mockJWTUtils.verifyToken.mockReturnValue(mockPayload);
      mockJWTUtils.extractUser.mockReturnValue({
        id: '123',
        email: 'test@example.com',
        role: 'user',
      });

      const middleware = JWTMiddleware.authenticateToken();
      await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockJWTUtils.verifyToken).toHaveBeenCalledWith('cookie-token');
      expect(mockReq.user).toBeDefined();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should throw TokenMissingError when no token provided', async () => {
      const middleware = JWTMiddleware.authenticateToken();
      await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(TokenMissingError));
    });

    it('should throw TokenInvalidError for invalid token', async () => {
      mockReq.headers = { authorization: 'Bearer invalid-token' };

      mockJWTUtils.verifyToken.mockImplementation(() => {
        throw new TokenInvalidError('Invalid signature');
      });

      const middleware = JWTMiddleware.authenticateToken();
      await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(TokenInvalidError));
    });

    it('should check token type restrictions', async () => {
      mockReq.headers = { authorization: 'Bearer refresh-token' };

      const mockPayload = {
        sub: '123',
        type: 'refresh' as const,
      };

      mockJWTUtils.verifyToken.mockReturnValue(mockPayload);

      const middleware = JWTMiddleware.authenticateToken({ tokenTypes: ['access'] });
      await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(TokenInvalidError));
    });

    it('should check role-based access', async () => {
      mockReq.headers = { authorization: 'Bearer user-token' };

      const mockPayload = {
        sub: '123',
        email: 'test@example.com',
        role: 'user',
        type: 'access' as const,
      };

      mockJWTUtils.verifyToken.mockReturnValue(mockPayload);
      mockJWTUtils.extractUser.mockReturnValue({
        id: '123',
        email: 'test@example.com',
        role: 'user',
      });

      const middleware = JWTMiddleware.authenticateToken({ roles: ['admin'] });
      await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(TokenInvalidError));
    });

    it('should allow access with correct role', async () => {
      mockReq.headers = { authorization: 'Bearer admin-token' };

      const mockPayload = {
        sub: '123',
        email: 'admin@example.com',
        role: 'admin',
        type: 'access' as const,
      };

      mockJWTUtils.verifyToken.mockReturnValue(mockPayload);
      mockJWTUtils.extractUser.mockReturnValue({
        id: '123',
        email: 'admin@example.com',
        role: 'admin',
      });

      const middleware = JWTMiddleware.authenticateToken({ roles: ['admin'] });
      await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockReq.user?.role).toBe('admin');
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('optionalAuthentication', () => {
    it('should authenticate when valid token is provided', async () => {
      mockReq.headers = { authorization: 'Bearer valid-token' };

      const mockPayload = {
        sub: '123',
        email: 'test@example.com',
        role: 'user',
        type: 'access' as const,
      };

      mockJWTUtils.verifyToken.mockReturnValue(mockPayload);
      mockJWTUtils.extractUser.mockReturnValue({
        id: '123',
        email: 'test@example.com',
        role: 'user',
      });

      const middleware = JWTMiddleware.optionalAuthentication();
      await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockReq.user).toBeDefined();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should continue without authentication when no token provided', async () => {
      const middleware = JWTMiddleware.optionalAuthentication();
      await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should continue without authentication when token is invalid', async () => {
      mockReq.headers = { authorization: 'Bearer invalid-token' };

      mockJWTUtils.verifyToken.mockImplementation(() => {
        throw new TokenInvalidError('Invalid signature');
      });

      const middleware = JWTMiddleware.optionalAuthentication();
      await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should ignore wrong token type in optional auth', async () => {
      mockReq.headers = { authorization: 'Bearer refresh-token' };

      const mockPayload = {
        sub: '123',
        type: 'refresh' as const,
      };

      mockJWTUtils.verifyToken.mockReturnValue(mockPayload);

      const middleware = JWTMiddleware.optionalAuthentication({ tokenTypes: ['access'] });
      await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('requireRole', () => {
    beforeEach(() => {
      mockReq.user = {
        id: '123',
        email: 'test@example.com',
        role: 'user',
      };
    });

    it('should allow access with correct role', () => {
      const middleware = JWTMiddleware.requireRole('user');
      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should allow access with one of multiple roles', () => {
      const middleware = JWTMiddleware.requireRole(['admin', 'user']);
      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should deny access with wrong role', () => {
      const middleware = JWTMiddleware.requireRole('admin');
      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(TokenInvalidError));
    });

    it('should deny access when user is not authenticated', () => {
      delete mockReq.user;

      const middleware = JWTMiddleware.requireRole('user');
      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(TokenMissingError));
    });

    it('should deny access when user has no role', () => {
      mockReq.user = {
        id: '123',
        email: 'test@example.com',
      };

      const middleware = JWTMiddleware.requireRole('user');
      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(TokenInvalidError));
    });
  });

  describe('requireRefreshToken', () => {
    it('should accept valid refresh token', async () => {
      mockReq.headers = { authorization: 'Bearer refresh-token' };

      const mockPayload = {
        sub: '123',
        type: 'refresh' as const,
      };

      mockJWTUtils.verifyToken.mockReturnValue(mockPayload);
      mockJWTUtils.extractUser.mockReturnValue({
        id: '123',
      });

      const middleware = JWTMiddleware.requireRefreshToken();
      await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockJWTUtils.verifyToken).toHaveBeenCalledWith('refresh-token');
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject access token', async () => {
      mockReq.headers = { authorization: 'Bearer access-token' };

      const mockPayload = {
        sub: '123',
        type: 'access' as const,
      };

      mockJWTUtils.verifyToken.mockReturnValue(mockPayload);

      const middleware = JWTMiddleware.requireRefreshToken();
      await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(TokenInvalidError));
    });
  });

  describe('requireVerificationToken', () => {
    it('should accept valid verification token', async () => {
      mockReq.headers = { authorization: 'Bearer verification-token' };

      const mockPayload = {
        sub: '123',
        email: 'test@example.com',
        type: 'verification' as const,
        purpose: 'email_verification',
      };

      mockJWTUtils.verifyVerificationToken.mockReturnValue(mockPayload);
      mockJWTUtils.extractUser.mockReturnValue({
        id: '123',
        email: 'test@example.com',
      });

      const middleware = JWTMiddleware.requireVerificationToken('email_verification');
      await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockJWTUtils.verifyVerificationToken).toHaveBeenCalledWith(
        'verification-token',
        'email_verification'
      );
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should accept verification token without purpose check', async () => {
      mockReq.headers = { authorization: 'Bearer verification-token' };

      const mockPayload = {
        sub: '123',
        email: 'test@example.com',
        type: 'verification' as const,
        purpose: 'password_reset',
      };

      mockJWTUtils.verifyVerificationToken.mockReturnValue(mockPayload);
      mockJWTUtils.extractUser.mockReturnValue({
        id: '123',
        email: 'test@example.com',
      });

      const middleware = JWTMiddleware.requireVerificationToken();
      await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockJWTUtils.verifyVerificationToken).toHaveBeenCalledWith(
        'verification-token',
        undefined
      );
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject token with wrong purpose', async () => {
      mockReq.headers = { authorization: 'Bearer verification-token' };

      mockJWTUtils.verifyVerificationToken.mockImplementation(() => {
        throw new TokenInvalidError('Wrong purpose');
      });

      const middleware = JWTMiddleware.requireVerificationToken('email_verification');
      await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(TokenInvalidError));
    });
  });
});
