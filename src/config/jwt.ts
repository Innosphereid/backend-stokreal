import { logger } from '@/utils/logger';

export interface JWTConfig {
  secret: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
  verificationTokenExpiry: string;
  issuer: string;
  audience: string;
  algorithm: 'HS256' | 'HS384' | 'HS512' | 'RS256' | 'RS384' | 'RS512';
}

// Environment-based configuration
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

// JWT Configuration
export const jwtConfig: JWTConfig = {
  secret: process.env.JWT_SECRET || '',
  accessTokenExpiry: process.env.JWT_ACCESS_TOKEN_EXPIRY || (isDevelopment ? '1h' : '15m'),
  refreshTokenExpiry: process.env.JWT_REFRESH_TOKEN_EXPIRY || (isDevelopment ? '30d' : '7d'),
  verificationTokenExpiry: process.env.JWT_VERIFICATION_TOKEN_EXPIRY || '1h',
  issuer: process.env.JWT_ISSUER || 'boilerplate-express-nodejs-typescript',
  audience: process.env.JWT_AUDIENCE || 'boilerplate-users',
  algorithm: (process.env.JWT_ALGORITHM as JWTConfig['algorithm']) || 'HS256',
};

// JWT Configuration utilities
export class JWTConfigUtils {
  /**
   * Validate JWT configuration
   */
  static validateConfig(): void {
    // Validate required secret
    if (!jwtConfig.secret) {
      throw new Error('JWT_SECRET is required. Please set JWT_SECRET environment variable.');
    }

    // Validate secret strength in production
    if (isProduction && jwtConfig.secret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long in production environment.');
    }

    // Warn about weak secrets in development
    if (isDevelopment && jwtConfig.secret.length < 16) {
      logger.warn('⚠️  JWT_SECRET is shorter than recommended (16+ characters)');
    }

    // Validate algorithm
    const validAlgorithms = ['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512'];
    if (!validAlgorithms.includes(jwtConfig.algorithm)) {
      throw new Error(
        `Invalid JWT_ALGORITHM: ${jwtConfig.algorithm}. Must be one of: ${validAlgorithms.join(', ')}`
      );
    }

    // Validate expiry formats (basic check)
    const expiryPattern = /^(\d+[smhdwy]|\d+)$/;
    if (!expiryPattern.test(jwtConfig.accessTokenExpiry)) {
      throw new Error(
        `Invalid JWT_ACCESS_TOKEN_EXPIRY format: ${jwtConfig.accessTokenExpiry}. Use formats like '15m', '1h', '7d'`
      );
    }

    if (!expiryPattern.test(jwtConfig.refreshTokenExpiry)) {
      throw new Error(
        `Invalid JWT_REFRESH_TOKEN_EXPIRY format: ${jwtConfig.refreshTokenExpiry}. Use formats like '15m', '1h', '7d'`
      );
    }

    if (!expiryPattern.test(jwtConfig.verificationTokenExpiry)) {
      throw new Error(
        `Invalid JWT_VERIFICATION_TOKEN_EXPIRY format: ${jwtConfig.verificationTokenExpiry}. Use formats like '15m', '1h', '7d'`
      );
    }

    // Production security warnings
    if (isProduction) {
      // Warn about long access token expiry in production
      if (this.parseExpiry(jwtConfig.accessTokenExpiry) > 3600) {
        // 1 hour
        logger.warn('⚠️  Access token expiry is longer than 1 hour in production');
      }

      // Warn about very long refresh token expiry
      if (this.parseExpiry(jwtConfig.refreshTokenExpiry) > 2592000) {
        // 30 days
        logger.warn('⚠️  Refresh token expiry is longer than 30 days in production');
      }
    }

    logger.info('JWT configuration validated successfully');
  }

  /**
   * Parse expiry string to seconds
   */
  private static parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhdwy]?)$/);
    if (!match) return parseInt(expiry, 10);

    const value = parseInt(match[1] || '0', 10);
    const unit = match[2] || 's';

    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
      w: 604800,
      y: 31536000,
    };

    return value * (multipliers[unit] || 1);
  }

  /**
   * Get configuration summary for debugging
   */
  static getConfigSummary(): Partial<JWTConfig> {
    return {
      accessTokenExpiry: jwtConfig.accessTokenExpiry,
      refreshTokenExpiry: jwtConfig.refreshTokenExpiry,
      verificationTokenExpiry: jwtConfig.verificationTokenExpiry,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
      algorithm: jwtConfig.algorithm,
      // Never expose the secret
    };
  }

  /**
   * Check if configuration is for production
   */
  static isProductionConfig(): boolean {
    return isProduction;
  }

  /**
   * Get token expiry for specific token type
   */
  static getTokenExpiry(type: 'access' | 'refresh' | 'verification'): string {
    switch (type) {
      case 'access':
        return jwtConfig.accessTokenExpiry;
      case 'refresh':
        return jwtConfig.refreshTokenExpiry;
      case 'verification':
        return jwtConfig.verificationTokenExpiry;
      default:
        throw new Error(`Unknown token type: ${type}`);
    }
  }
}

// Initialize and validate configuration on module load
try {
  JWTConfigUtils.validateConfig();
} catch (error) {
  logger.error('JWT configuration validation failed:', error);
  if (isProduction) {
    // In production, fail fast on configuration errors
    process.exit(1);
  }
}

export default jwtConfig;
