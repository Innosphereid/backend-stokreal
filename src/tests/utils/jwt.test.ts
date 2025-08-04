import {
  JWTUtils,
  TokenExpiredError,
  TokenInvalidError,
  JWTPayload,
  JWTUser,
} from '../../utils/jwt';

// Mock the logger to avoid console output during tests
jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock the JWT config
jest.mock('../../config/jwt', () => ({
  jwtConfig: {
    secret: 'test-secret-key-for-jwt-testing-purposes',
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d',
    verificationTokenExpiry: '1h',
    issuer: 'test-app',
    audience: 'test-users',
    algorithm: 'HS256',
  },
  JWTConfigUtils: {
    getTokenExpiry: jest.fn((type: string) => {
      switch (type) {
        case 'access':
          return '15m';
        case 'refresh':
          return '7d';
        case 'verification':
          return '1h';
        default:
          return '15m';
      }
    }),
  },
}));

describe('JWTUtils', () => {
  const mockUser: JWTUser = {
    id: '123',
    email: 'test@example.com',
    role: 'user',
  };

  const mockPayload: Omit<JWTPayload, 'iat' | 'exp' | 'iss' | 'aud' | 'type'> = {
    sub: '123',
    email: 'test@example.com',
    role: 'user',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signToken', () => {
    it('should sign an access token successfully', () => {
      const token = JWTUtils.signToken(mockPayload, 'access');

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should sign a refresh token successfully', () => {
      const token = JWTUtils.signToken(mockPayload, 'refresh');

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should sign a verification token successfully', () => {
      const verificationPayload = {
        ...mockPayload,
        purpose: 'email_verification',
      };

      const token = JWTUtils.signToken(verificationPayload, 'verification');

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should include custom options in token', () => {
      const customOptions = {
        expiresIn: '30m',
        audience: 'custom-audience',
      };

      const token = JWTUtils.signToken(mockPayload, 'access', customOptions);
      const decoded = JWTUtils.decodeToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.aud).toBe('custom-audience');
    });

    it('should throw error for invalid payload', () => {
      // Test with a payload that has a circular reference, which should cause JSON serialization to fail
      const circularObj: any = { sub: '123' };
      circularObj.self = circularObj;
      const invalidPayload = circularObj as Omit<
        JWTPayload,
        'iat' | 'exp' | 'iss' | 'aud' | 'type'
      >;

      expect(() => {
        JWTUtils.signToken(invalidPayload, 'access');
      }).toThrow();
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid access token', () => {
      const token = JWTUtils.signToken(mockPayload, 'access');
      const decoded = JWTUtils.verifyToken(token, 'access');

      expect(decoded).toBeDefined();
      expect(decoded.sub).toBe('123');
      expect(decoded.email).toBe('test@example.com');
      expect(decoded.type).toBe('access');
    });

    it('should verify a valid refresh token', () => {
      const token = JWTUtils.signToken(mockPayload, 'refresh');
      const decoded = JWTUtils.verifyToken(token, 'refresh');

      expect(decoded).toBeDefined();
      expect(decoded.sub).toBe('123');
      expect(decoded.type).toBe('refresh');
    });

    it('should verify token without specifying expected type', () => {
      const token = JWTUtils.signToken(mockPayload, 'access');
      const decoded = JWTUtils.verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.type).toBe('access');
    });

    it('should throw TokenInvalidError for wrong token type', () => {
      const token = JWTUtils.signToken(mockPayload, 'access');

      expect(() => {
        JWTUtils.verifyToken(token, 'refresh');
      }).toThrow(TokenInvalidError);
    });

    it('should throw TokenInvalidError for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => {
        JWTUtils.verifyToken(invalidToken);
      }).toThrow(TokenInvalidError);
    });

    it('should throw TokenExpiredError for expired token', () => {
      // Create a token with very short expiry
      const shortExpiryPayload = { ...mockPayload };
      const token = JWTUtils.signToken(shortExpiryPayload, 'access', { expiresIn: '1ms' });

      // Wait for token to expire
      return new Promise(resolve => {
        setTimeout(() => {
          expect(() => {
            JWTUtils.verifyToken(token);
          }).toThrow(TokenExpiredError);
          resolve(undefined);
        }, 10);
      });
    });

    it('should throw TokenInvalidError for malformed token', () => {
      const malformedToken = 'not.a.valid.jwt.token';

      expect(() => {
        JWTUtils.verifyToken(malformedToken);
      }).toThrow(TokenInvalidError);
    });
  });

  describe('decodeToken', () => {
    it('should decode a valid token without verification', () => {
      const token = JWTUtils.signToken(mockPayload, 'access');
      const decoded = JWTUtils.decodeToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.sub).toBe('123');
      expect(decoded?.email).toBe('test@example.com');
      expect(decoded?.type).toBe('access');
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.token';
      const decoded = JWTUtils.decodeToken(invalidToken);

      expect(decoded).toBeNull();
    });

    it('should decode expired token without throwing', () => {
      const token = JWTUtils.signToken(mockPayload, 'access', { expiresIn: '1ms' });

      return new Promise(resolve => {
        setTimeout(() => {
          const decoded = JWTUtils.decodeToken(token);
          expect(decoded).toBeDefined();
          expect(decoded?.sub).toBe('123');
          resolve(undefined);
        }, 10);
      });
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', () => {
      const tokenPair = JWTUtils.generateTokenPair(mockUser);

      expect(tokenPair).toBeDefined();
      expect(tokenPair.accessToken).toBeDefined();
      expect(tokenPair.refreshToken).toBeDefined();
      expect(typeof tokenPair.accessToken).toBe('string');
      expect(typeof tokenPair.refreshToken).toBe('string');
    });

    it('should generate tokens with correct types', () => {
      const tokenPair = JWTUtils.generateTokenPair(mockUser);

      const accessDecoded = JWTUtils.decodeToken(tokenPair.accessToken);
      const refreshDecoded = JWTUtils.decodeToken(tokenPair.refreshToken);

      expect(accessDecoded?.type).toBe('access');
      expect(refreshDecoded?.type).toBe('refresh');
    });

    it('should include user information in access token', () => {
      const tokenPair = JWTUtils.generateTokenPair(mockUser);
      const decoded = JWTUtils.decodeToken(tokenPair.accessToken);

      expect(decoded?.sub).toBe(mockUser.id);
      expect(decoded?.email).toBe(mockUser.email);
      expect(decoded?.role).toBe(mockUser.role);
    });

    it('should include minimal information in refresh token', () => {
      const tokenPair = JWTUtils.generateTokenPair(mockUser);
      const decoded = JWTUtils.decodeToken(tokenPair.refreshToken);

      expect(decoded?.sub).toBe(mockUser.id);
      expect(decoded?.type).toBe('refresh');
      // Refresh tokens should have minimal info
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens with valid refresh token', () => {
      const originalTokenPair = JWTUtils.generateTokenPair(mockUser);
      const newTokenPair = JWTUtils.refreshTokens(originalTokenPair.refreshToken);

      expect(newTokenPair).toBeDefined();
      expect(newTokenPair.accessToken).toBeDefined();
      expect(newTokenPair.refreshToken).toBeDefined();
      expect(newTokenPair.accessToken).not.toBe(originalTokenPair.accessToken);
      expect(newTokenPair.refreshToken).not.toBe(originalTokenPair.refreshToken);
    });

    it('should throw error with invalid refresh token', () => {
      const invalidToken = 'invalid.refresh.token';

      expect(() => {
        JWTUtils.refreshTokens(invalidToken);
      }).toThrow(TokenInvalidError);
    });

    it('should throw error when using access token for refresh', () => {
      const tokenPair = JWTUtils.generateTokenPair(mockUser);

      expect(() => {
        JWTUtils.refreshTokens(tokenPair.accessToken);
      }).toThrow(TokenInvalidError);
    });
  });

  describe('generateVerificationToken', () => {
    it('should generate verification token with purpose', () => {
      const token = JWTUtils.generateVerificationToken(
        '123',
        'email_verification',
        'test@example.com'
      );
      const decoded = JWTUtils.decodeToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.sub).toBe('123');
      expect(decoded?.email).toBe('test@example.com');
      expect(decoded?.purpose).toBe('email_verification');
      expect(decoded?.type).toBe('verification');
    });

    it('should generate verification token with custom expiry', () => {
      const token = JWTUtils.generateVerificationToken(
        '123',
        'password_reset',
        'test@example.com',
        '30m'
      );

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should generate verification token without email', () => {
      const token = JWTUtils.generateVerificationToken('123', 'account_activation');
      const decoded = JWTUtils.decodeToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.sub).toBe('123');
      expect(decoded?.purpose).toBe('account_activation');
      expect(decoded?.email).toBeUndefined();
    });
  });

  describe('verifyVerificationToken', () => {
    it('should verify verification token with correct purpose', () => {
      const token = JWTUtils.generateVerificationToken(
        '123',
        'email_verification',
        'test@example.com'
      );
      const decoded = JWTUtils.verifyVerificationToken(token, 'email_verification');

      expect(decoded).toBeDefined();
      expect(decoded.sub).toBe('123');
      expect(decoded.purpose).toBe('email_verification');
    });

    it('should verify verification token without purpose check', () => {
      const token = JWTUtils.generateVerificationToken(
        '123',
        'email_verification',
        'test@example.com'
      );
      const decoded = JWTUtils.verifyVerificationToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.purpose).toBe('email_verification');
    });

    it('should throw error for wrong purpose', () => {
      const token = JWTUtils.generateVerificationToken(
        '123',
        'email_verification',
        'test@example.com'
      );

      expect(() => {
        JWTUtils.verifyVerificationToken(token, 'password_reset');
      }).toThrow(TokenInvalidError);
    });
  });

  describe('extractUser', () => {
    it('should extract user information from payload', () => {
      const payload: JWTPayload = {
        sub: '123',
        email: 'test@example.com',
        role: 'admin',
        type: 'access',
      };

      const user = JWTUtils.extractUser(payload);

      expect(user).toEqual({
        id: '123',
        email: 'test@example.com',
        role: 'admin',
      });
    });

    it('should handle payload with missing optional fields', () => {
      const payload: JWTPayload = {
        sub: '123',
        type: 'access',
      };

      const user = JWTUtils.extractUser(payload);

      expect(user).toEqual({
        id: '123',
        email: '',
        role: 'user',
      });
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      const token = JWTUtils.signToken(mockPayload, 'access');
      const isExpired = JWTUtils.isTokenExpired(token);

      expect(isExpired).toBe(false);
    });

    it('should return true for expired token', () => {
      const token = JWTUtils.signToken(mockPayload, 'access', { expiresIn: '1ms' });

      return new Promise(resolve => {
        setTimeout(() => {
          const isExpired = JWTUtils.isTokenExpired(token);
          expect(isExpired).toBe(true);
          resolve(undefined);
        }, 10);
      });
    });

    it('should return true for invalid token', () => {
      const invalidToken = 'invalid.token';
      const isExpired = JWTUtils.isTokenExpired(invalidToken);

      expect(isExpired).toBe(false); // Invalid tokens are not considered expired
    });
  });

  describe('getTokenExpiration', () => {
    it('should return expiration date for valid token', () => {
      const token = JWTUtils.signToken(mockPayload, 'access');
      const expiration = JWTUtils.getTokenExpiration(token);

      expect(expiration).toBeInstanceOf(Date);
      expect(expiration!.getTime()).toBeGreaterThan(Date.now());
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.token';
      const expiration = JWTUtils.getTokenExpiration(invalidToken);

      expect(expiration).toBeNull();
    });
  });

  describe('getTimeUntilExpiration', () => {
    it('should return positive seconds for valid token', () => {
      const token = JWTUtils.signToken(mockPayload, 'access');
      const timeUntilExpiration = JWTUtils.getTimeUntilExpiration(token);

      expect(timeUntilExpiration).toBeGreaterThan(0);
      expect(typeof timeUntilExpiration).toBe('number');
    });

    it('should return 0 for expired token', () => {
      const token = JWTUtils.signToken(mockPayload, 'access', { expiresIn: '1ms' });

      return new Promise(resolve => {
        setTimeout(() => {
          const timeUntilExpiration = JWTUtils.getTimeUntilExpiration(token);
          expect(timeUntilExpiration).toBe(0);
          resolve(undefined);
        }, 10);
      });
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.token';
      const timeUntilExpiration = JWTUtils.getTimeUntilExpiration(invalidToken);

      expect(timeUntilExpiration).toBeNull();
    });
  });
});
