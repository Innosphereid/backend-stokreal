import { JWTUtils } from '../../utils/jwt';
import { jwtConfig } from '../../config/jwt';
import { JWTUser, TokenPair, JWTPayload } from '../../types/jwt';

// Mock dependencies
jest.mock('../../config/jwt');
jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const mockJwtConfig = jwtConfig as jest.Mocked<typeof jwtConfig>;

describe('JWTUtils', () => {
  const mockUser: JWTUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'user',
  };

  const mockPayload: JWTPayload = {
    sub: 'test-user-id',
    email: 'test@example.com',
    role: 'user',
    type: 'access',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    iss: 'stokreal-backend',
    aud: 'stokreal-users',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock JWT config
    mockJwtConfig.secret = 'test-secret';
    mockJwtConfig.issuer = 'stokreal-backend';
    mockJwtConfig.audience = 'stokreal-users';
    mockJwtConfig.algorithm = 'HS256';
  });

  describe('signToken', () => {
    it('should sign access token successfully', () => {
      const payload = {
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      };

      // Mock jwt.sign to return a token
      const mockToken = 'mock.jwt.token';
      jest.spyOn(require('jsonwebtoken'), 'sign').mockReturnValue(mockToken);

      const result = JWTUtils.signToken(payload, 'access');

      expect(result).toBe(mockToken);
      expect(require('jsonwebtoken').sign).toHaveBeenCalledWith(
        expect.objectContaining({
          ...payload,
          type: 'access',
        }),
        mockJwtConfig.secret,
        expect.objectContaining({
          expiresIn: expect.any(String),
          issuer: mockJwtConfig.issuer,
          audience: mockJwtConfig.audience,
          algorithm: mockJwtConfig.algorithm,
        })
      );
    });

    it('should sign verification token with custom expiration', () => {
      const payload = {
        sub: mockUser.id,
        email: mockUser.email,
        purpose: 'email_verification',
      };

      const mockToken = 'mock.verification.token';
      jest.spyOn(require('jsonwebtoken'), 'sign').mockReturnValue(mockToken);

      const result = JWTUtils.signToken(payload, 'verification', { expiresIn: '24h' });

      expect(result).toBe(mockToken);
      expect(require('jsonwebtoken').sign).toHaveBeenCalledWith(
        expect.objectContaining({
          ...payload,
          type: 'verification',
        }),
        mockJwtConfig.secret,
        expect.objectContaining({
          expiresIn: '24h',
        })
      );
    });

    it('should handle signing errors', () => {
      const payload = { sub: mockUser.id };

      jest.spyOn(require('jsonwebtoken'), 'sign').mockImplementation(() => {
        throw new Error('JWT signing failed');
      });

      expect(() => JWTUtils.signToken(payload, 'access')).toThrow('Failed to sign access token');
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token successfully', () => {
      const token = 'valid.jwt.token';

      jest.spyOn(require('jsonwebtoken'), 'verify').mockReturnValue(mockPayload);

      const result = JWTUtils.verifyToken(token, 'access');

      expect(result).toEqual(mockPayload);
      expect(require('jsonwebtoken').verify).toHaveBeenCalledWith(
        token,
        mockJwtConfig.secret,
        expect.objectContaining({
          issuer: mockJwtConfig.issuer,
          audience: mockJwtConfig.audience,
          algorithms: [mockJwtConfig.algorithm],
        })
      );
    });

    it('should throw error for wrong token type', () => {
      const token = 'valid.jwt.token';
      const wrongTypePayload = { ...mockPayload, type: 'refresh' };

      jest.spyOn(require('jsonwebtoken'), 'verify').mockReturnValue(wrongTypePayload);

      expect(() => JWTUtils.verifyToken(token, 'access')).toThrow(
        'Expected access token, got refresh'
      );
    });

    it('should handle expired token', () => {
      const token = 'expired.jwt.token';

      const TokenExpiredError = require('jsonwebtoken').TokenExpiredError;
      jest.spyOn(require('jsonwebtoken'), 'verify').mockImplementation(() => {
        throw new TokenExpiredError('Token expired', new Date());
      });

      // Mock decode to return payload for better error message
      jest.spyOn(require('jsonwebtoken'), 'decode').mockReturnValue({ type: 'access' });

      expect(() => JWTUtils.verifyToken(token, 'access')).toThrow('Token expired');
    });

    it('should handle invalid token', () => {
      const token = 'invalid.jwt.token';

      const JsonWebTokenError = require('jsonwebtoken').JsonWebTokenError;
      jest.spyOn(require('jsonwebtoken'), 'verify').mockImplementation(() => {
        throw new JsonWebTokenError('Invalid token');
      });

      expect(() => JWTUtils.verifyToken(token, 'access')).toThrow('Invalid token');
    });
  });

  describe('generateTokenPair', () => {
    it('should generate access and refresh tokens', () => {
      const mockAccessToken = 'access.token';
      const mockRefreshToken = 'refresh.token';

      jest
        .spyOn(JWTUtils, 'signToken')
        .mockReturnValueOnce(mockAccessToken)
        .mockReturnValueOnce(mockRefreshToken);

      const result = JWTUtils.generateTokenPair(mockUser);

      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });

      expect(JWTUtils.signToken).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
        }),
        'access'
      );

      expect(JWTUtils.signToken).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUser.id,
        }),
        'refresh'
      );
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens using valid refresh token', () => {
      const refreshToken = 'valid.refresh.token';
      const newTokens: TokenPair = {
        accessToken: 'new.access.token',
        refreshToken: 'new.refresh.token',
      };

      jest.spyOn(JWTUtils, 'verifyToken').mockReturnValue({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        type: 'refresh',
      } as JWTPayload);

      jest.spyOn(JWTUtils, 'generateTokenPair').mockReturnValue(newTokens);

      const result = JWTUtils.refreshTokens(refreshToken);

      expect(result).toEqual(newTokens);
      expect(JWTUtils.verifyToken).toHaveBeenCalledWith(refreshToken, 'refresh');
      expect(JWTUtils.generateTokenPair).toHaveBeenCalledWith({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
    });

    it('should throw error for invalid refresh token', () => {
      const refreshToken = 'invalid.refresh.token';

      jest.spyOn(JWTUtils, 'verifyToken').mockImplementation(() => {
        throw new Error('Invalid refresh token');
      });

      expect(() => JWTUtils.refreshTokens(refreshToken)).toThrow('Invalid refresh token');
    });
  });

  describe('generateVerificationToken', () => {
    it('should generate verification token with purpose', () => {
      const userId = 'test-user-id';
      const purpose = 'email_verification';
      const email = 'test@example.com';
      const expiresIn = '24h';
      const mockToken = 'verification.token';

      jest.spyOn(JWTUtils, 'signToken').mockReturnValue(mockToken);

      const result = JWTUtils.generateVerificationToken(userId, purpose, email, expiresIn);

      expect(result).toBe(mockToken);
      expect(JWTUtils.signToken).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: userId,
          email,
          purpose,
        }),
        'verification',
        { expiresIn }
      );
    });

    it('should generate verification token without email', () => {
      const userId = 'test-user-id';
      const purpose = 'password_reset';
      const mockToken = 'verification.token';

      jest.spyOn(JWTUtils, 'signToken').mockReturnValue(mockToken);

      const result = JWTUtils.generateVerificationToken(userId, purpose);

      expect(result).toBe(mockToken);
      expect(JWTUtils.signToken).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: userId,
          purpose,
        }),
        'verification',
        undefined
      );
    });
  });

  describe('verifyVerificationToken', () => {
    it('should verify verification token successfully', () => {
      const token = 'verification.token';
      const purpose = 'email_verification';
      const mockPayload = {
        sub: 'test-user-id',
        email: 'test@example.com',
        purpose: 'email_verification',
        type: 'verification',
      } as JWTPayload;

      jest.spyOn(JWTUtils, 'verifyToken').mockReturnValue(mockPayload);

      const result = JWTUtils.verifyVerificationToken(token, purpose);

      expect(result).toEqual(mockPayload);
      expect(JWTUtils.verifyToken).toHaveBeenCalledWith(token, 'verification');
    });

    it('should throw error for wrong purpose', () => {
      const token = 'verification.token';
      const expectedPurpose = 'email_verification';
      const actualPurpose = 'password_reset';
      const mockPayload = {
        sub: 'test-user-id',
        purpose: actualPurpose,
        type: 'verification',
      } as JWTPayload;

      jest.spyOn(JWTUtils, 'verifyToken').mockReturnValue(mockPayload);

      expect(() => JWTUtils.verifyVerificationToken(token, expectedPurpose)).toThrow(
        `Expected verification token for ${expectedPurpose}, got ${actualPurpose}`
      );
    });
  });

  describe('extractUser', () => {
    it('should extract user from JWT payload', () => {
      const payload: JWTPayload = {
        sub: 'test-user-id',
        email: 'test@example.com',
        role: 'user',
        type: 'access',
      };

      const result = JWTUtils.extractUser(payload);

      expect(result).toEqual({
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'user',
      });
    });

    it('should handle payload without email and role', () => {
      const payload: JWTPayload = {
        sub: 'test-user-id',
        type: 'refresh',
      };

      const result = JWTUtils.extractUser(payload);

      expect(result).toEqual({
        id: 'test-user-id',
        email: '',
        role: 'user',
      });
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      const token = 'valid.token';

      jest.spyOn(JWTUtils, 'verifyToken').mockReturnValue(mockPayload);

      const result = JWTUtils.isTokenExpired(token);

      expect(result).toBe(false);
    });

    it('should return true for expired token', () => {
      const token = 'expired.token';

      jest.spyOn(JWTUtils, 'verifyToken').mockImplementation(() => {
        throw new Error('Token expired');
      });

      const result = JWTUtils.isTokenExpired(token);

      expect(result).toBe(true);
    });
  });

  describe('getTokenExpiration', () => {
    it('should return expiration date for valid token', () => {
      const token = 'valid.token';
      const expirationTime = Math.floor(Date.now() / 1000) + 3600;
      const mockDecoded = { exp: expirationTime };

      jest.spyOn(JWTUtils, 'decodeToken').mockReturnValue(mockDecoded as JWTPayload);

      const result = JWTUtils.getTokenExpiration(token);

      expect(result).toEqual(new Date(expirationTime * 1000));
    });

    it('should return null for token without expiration', () => {
      const token = 'token.without.exp';
      const mockDecoded = { sub: 'test-user-id' };

      jest.spyOn(JWTUtils, 'decodeToken').mockReturnValue(mockDecoded as JWTPayload);

      const result = JWTUtils.getTokenExpiration(token);

      expect(result).toBeNull();
    });

    it('should return null for invalid token', () => {
      const token = 'invalid.token';

      jest.spyOn(JWTUtils, 'decodeToken').mockReturnValue(null);

      const result = JWTUtils.getTokenExpiration(token);

      expect(result).toBeNull();
    });
  });

  describe('getTimeUntilExpiration', () => {
    it('should return time until expiration in seconds', () => {
      const token = 'valid.token';
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const mockDecoded = { exp: futureTime };

      jest.spyOn(JWTUtils, 'decodeToken').mockReturnValue(mockDecoded as JWTPayload);

      const result = JWTUtils.getTimeUntilExpiration(token);

      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(3600);
    });

    it('should return 0 for expired token', () => {
      const token = 'expired.token';
      const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const mockDecoded = { exp: pastTime };

      jest.spyOn(JWTUtils, 'decodeToken').mockReturnValue(mockDecoded as JWTPayload);

      const result = JWTUtils.getTimeUntilExpiration(token);

      expect(result).toBe(0);
    });

    it('should return null for token without expiration', () => {
      const token = 'token.without.exp';
      const mockDecoded = { sub: 'test-user-id' };

      jest.spyOn(JWTUtils, 'decodeToken').mockReturnValue(mockDecoded as JWTPayload);

      const result = JWTUtils.getTimeUntilExpiration(token);

      expect(result).toBeNull();
    });
  });

  describe('decodeToken', () => {
    it('should decode token successfully', () => {
      const token = 'valid.token';
      const mockDecoded = { sub: 'test-user-id', type: 'access' };

      jest.spyOn(require('jsonwebtoken'), 'decode').mockReturnValue(mockDecoded);

      const result = JWTUtils.decodeToken(token);

      expect(result).toEqual(mockDecoded);
      expect(require('jsonwebtoken').decode).toHaveBeenCalledWith(token);
    });

    it('should return null for invalid token', () => {
      const token = 'invalid.token';

      jest.spyOn(require('jsonwebtoken'), 'decode').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = JWTUtils.decodeToken(token);

      expect(result).toBeNull();
    });
  });
});
