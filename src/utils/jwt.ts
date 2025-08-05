import jwt from 'jsonwebtoken';
import { jwtConfig, JWTConfigUtils } from '@/config/jwt';
import { logger } from '@/utils/logger';
import {
  TokenType,
  JWTPayload,
  JWTUser,
  TokenPair,
  SignTokenOptions,
  JWTError,
  TokenExpiredError,
  TokenInvalidError,
} from '@/types/jwt';

/**
 * JWT Utility class for token operations
 */
export class JWTUtils {
  /**
   * Sign a JWT token
   */
  static signToken(
    payload: Omit<JWTPayload, 'iat' | 'exp' | 'iss' | 'aud' | 'type'>,
    type: TokenType,
    options?: SignTokenOptions
  ): string {
    try {
      const tokenPayload: JWTPayload = {
        ...payload,
        type,
      };

      const signOptions: jwt.SignOptions = {
        expiresIn: (options?.expiresIn || JWTConfigUtils.getTokenExpiry(type)) as any,
        issuer: options?.issuer || jwtConfig.issuer,
        audience: options?.audience || jwtConfig.audience,
        algorithm: jwtConfig.algorithm,
        jwtid:
          Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      };

      const token = jwt.sign(tokenPayload, jwtConfig.secret, signOptions);

      logger.debug(`Signed ${type} token for user ${payload.sub}`);
      return token;
    } catch (error) {
      logger.error(`Failed to sign ${type} token:`, error);
      throw new JWTError(
        `Failed to sign ${type} token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Verify and decode a JWT token
   */
  static verifyToken(token: string, expectedType?: TokenType): JWTPayload {
    try {
      const decoded = jwt.verify(token, jwtConfig.secret, {
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
        algorithms: [jwtConfig.algorithm],
      }) as JWTPayload;

      // Validate token type if specified
      if (expectedType && decoded.type !== expectedType) {
        throw new TokenInvalidError(`Expected ${expectedType} token, got ${decoded.type}`);
      }

      logger.debug(`Verified ${decoded.type} token for user ${decoded.sub}`);
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        // Try to decode to get token type for better error message
        try {
          const decoded = jwt.decode(token) as JWTPayload;
          throw new TokenExpiredError(decoded?.type || 'unknown');
        } catch {
          throw new TokenExpiredError('access');
        }
      }

      if (error instanceof jwt.JsonWebTokenError) {
        throw new TokenInvalidError(error.message);
      }

      if (error instanceof TokenInvalidError || error instanceof TokenExpiredError) {
        throw error;
      }

      logger.error('Token verification failed:', error);
      throw new TokenInvalidError('Token verification failed');
    }
  }

  /**
   * Decode a JWT token without verification (for debugging/inspection)
   */
  static decodeToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      return decoded;
    } catch (error) {
      logger.error('Token decoding failed:', error);
      return null;
    }
  }

  /**
   * Generate a token pair (access + refresh tokens)
   */
  static generateTokenPair(user: JWTUser): TokenPair {
    const accessTokenPayload = {
      sub: user.id,
      ...(user.email && { email: user.email }),
      ...(user.role && { role: user.role }),
    };

    const refreshTokenPayload = {
      sub: user.id,
      // Refresh tokens typically contain minimal information
    };

    const accessToken = this.signToken(accessTokenPayload, 'access');
    const refreshToken = this.signToken(refreshTokenPayload, 'refresh');

    logger.info(`Generated token pair for user ${user.id}`);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh tokens using a valid refresh token
   */
  static refreshTokens(refreshToken: string): TokenPair {
    try {
      // Verify the refresh token
      const decoded = this.verifyToken(refreshToken, 'refresh');

      // Create new token pair with minimal user info from refresh token
      const user: JWTUser = {
        id: decoded.sub,
        email: decoded.email || '',
        role: decoded.role || 'user',
      };

      return this.generateTokenPair(user);
    } catch (error) {
      logger.error('Token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Generate a verification token for email verification, password reset, etc.
   */
  static generateVerificationToken(
    userId: string,
    purpose: string,
    email?: string,
    expiresIn?: string
  ): string {
    const payload = {
      sub: userId,
      ...(email && { email }),
      purpose,
    };

    const options: SignTokenOptions | undefined = expiresIn ? { expiresIn } : undefined;

    return this.signToken(payload, 'verification', options);
  }

  /**
   * Generate a short verification token (max 255 chars) for database storage
   */
  static generateShortVerificationToken(
    userId: string,
    purpose: string,
    email?: string,
    expiresIn?: string
  ): string {
    const payload = {
      sub: userId,
      ...(email && { email }),
      purpose,
    };

    const options: SignTokenOptions | undefined = expiresIn ? { expiresIn } : undefined;

    // Use a more compact signing approach
    const tokenPayload: JWTPayload = {
      ...payload,
      type: 'verification',
    };

    const signOptions: jwt.SignOptions = {
      expiresIn: (options?.expiresIn || JWTConfigUtils.getTokenExpiry('verification')) as any,
      issuer: options?.issuer || jwtConfig.issuer,
      audience: options?.audience || jwtConfig.audience,
      algorithm: jwtConfig.algorithm,
      // Remove jwtid to make token shorter
    };

    const token = jwt.sign(tokenPayload, jwtConfig.secret, signOptions);

    // If token is still too long, truncate it (not recommended for production)
    if (token.length > 255) {
      logger.warn(`Generated token is ${token.length} chars, truncating to 255`);
      return token.substring(0, 255);
    }

    logger.debug(`Signed short verification token for user ${userId}`);
    return token;
  }

  /**
   * Verify a verification token and return its payload
   */
  static verifyVerificationToken(token: string, expectedPurpose?: string): JWTPayload {
    const decoded = this.verifyToken(token, 'verification');

    // Validate purpose if specified
    if (expectedPurpose && decoded.purpose !== expectedPurpose) {
      throw new TokenInvalidError(
        `Expected verification token for ${expectedPurpose}, got ${decoded.purpose}`
      );
    }

    return decoded;
  }

  /**
   * Extract user information from a verified token
   */
  static extractUser(payload: JWTPayload): JWTUser {
    return {
      id: payload.sub,
      email: payload.email || '',
      role: payload.role || 'user',
    };
  }

  /**
   * Check if a token is expired (without throwing)
   */
  static isTokenExpired(token: string): boolean {
    try {
      this.verifyToken(token);
      return false;
    } catch (error) {
      return error instanceof TokenExpiredError;
    }
  }

  /**
   * Get token expiration time
   */
  static getTokenExpiration(token: string): Date | null {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) {
      return null;
    }

    return new Date(decoded.exp * 1000);
  }

  /**
   * Get time until token expires (in seconds)
   */
  static getTimeUntilExpiration(token: string): number | null {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) {
      return null;
    }

    const now = new Date();
    const timeUntilExpiration = Math.floor((expiration.getTime() - now.getTime()) / 1000);

    return Math.max(0, timeUntilExpiration);
  }
}

// Re-export types and classes for convenience
export {
  TokenType,
  JWTPayload,
  JWTUser,
  TokenPair,
  SignTokenOptions,
  JWTError,
  TokenExpiredError,
  TokenInvalidError,
  TokenMissingError,
} from '@/types/jwt';

export default JWTUtils;
