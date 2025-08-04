import { CookieOptions, Response, Request } from 'express';
import { logger } from '@/utils/logger';

export interface CookieConfig {
  session: CookieOptions;
  auth: CookieOptions;
  csrf: CookieOptions;
  remember: CookieOptions;
  jwt_access: CookieOptions;
  jwt_refresh: CookieOptions;
}

// Cookie configuration based on environment
const isProduction = process.env.NODE_ENV === 'production';

// Base cookie options
const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction, // Only send over HTTPS in production
  sameSite: isProduction ? 'strict' : 'lax',
  domain: process.env.COOKIE_DOMAIN || undefined,
  path: '/',
};

// Cookie configuration
export const cookieConfig: CookieConfig = {
  // Session cookie configuration
  session: {
    ...baseCookieOptions,
    maxAge: parseInt(process.env.SESSION_COOKIE_MAX_AGE || '86400000', 10), // 24 hours default
    signed: true, // Sign the cookie for security
  },

  // Authentication cookie configuration
  auth: {
    ...baseCookieOptions,
    maxAge: parseInt(process.env.AUTH_COOKIE_MAX_AGE || '604800000', 10), // 7 days default
    signed: true,
    httpOnly: true,
  },

  // CSRF token cookie configuration
  csrf: {
    ...baseCookieOptions,
    httpOnly: false, // CSRF tokens need to be accessible by client-side JavaScript
    maxAge: parseInt(process.env.CSRF_COOKIE_MAX_AGE || '86400000', 10), // 24 hours default
    signed: false, // CSRF tokens don't need to be signed
  },

  // Remember me cookie configuration
  remember: {
    ...baseCookieOptions,
    maxAge: parseInt(process.env.REMEMBER_COOKIE_MAX_AGE || '2592000000', 10), // 30 days default
    signed: true,
    httpOnly: true,
  },

  // JWT access token cookie configuration
  jwt_access: {
    ...baseCookieOptions,
    maxAge: parseInt(process.env.JWT_ACCESS_COOKIE_MAX_AGE || '900000', 10), // 15 minutes default
    signed: true,
    httpOnly: true,
  },

  // JWT refresh token cookie configuration
  jwt_refresh: {
    ...baseCookieOptions,
    maxAge: parseInt(process.env.JWT_REFRESH_COOKIE_MAX_AGE || '604800000', 10), // 7 days default
    signed: true,
    httpOnly: true,
  },
};

// Cookie names
export const cookieNames = {
  session: process.env.SESSION_COOKIE_NAME || 'session',
  auth: process.env.AUTH_COOKIE_NAME || 'auth_token',
  csrf: process.env.CSRF_COOKIE_NAME || 'csrf_token',
  remember: process.env.REMEMBER_COOKIE_NAME || 'remember_token',
  jwt_access: process.env.JWT_ACCESS_COOKIE_NAME || 'jwt_access',
  jwt_refresh: process.env.JWT_REFRESH_COOKIE_NAME || 'jwt_refresh',
} as const;

// Cookie utilities
export class CookieUtils {
  /**
   * Get cookie options for a specific type
   */
  static getOptions(type: keyof CookieConfig): CookieOptions {
    return cookieConfig[type];
  }

  /**
   * Get cookie name for a specific type
   */
  static getName(type: keyof typeof cookieNames): string {
    return cookieNames[type];
  }

  /**
   * Create a secure cookie value with expiration
   */
  static createSecureCookie(
    value: string,
    expiresIn?: number
  ): {
    value: string;
    options: CookieOptions;
  } {
    const options: CookieOptions = {
      ...baseCookieOptions,
      maxAge: expiresIn || 86400000, // 24 hours default
      signed: true,
    };

    return {
      value,
      options,
    };
  }

  /**
   * Clear cookie options (for logout)
   */
  static getClearOptions(): CookieOptions {
    return {
      ...baseCookieOptions,
      maxAge: 0,
      expires: new Date(0),
    };
  }

  /**
   * Set JWT cookies with proper configuration
   */
  static setJWTCookies(res: Response, accessToken: string, refreshToken?: string): void {
    const accessCookieName = this.getName('jwt_access');
    const accessOptions = this.getOptions('jwt_access');

    res.cookie(accessCookieName, accessToken, accessOptions);

    if (refreshToken) {
      const refreshCookieName = this.getName('jwt_refresh');
      const refreshOptions = this.getOptions('jwt_refresh');
      res.cookie(refreshCookieName, refreshToken, refreshOptions);
    }
  }

  /**
   * Clear JWT cookies
   */
  static clearJWTCookies(res: Response): void {
    const accessCookieName = this.getName('jwt_access');
    const refreshCookieName = this.getName('jwt_refresh');
    const clearOptions = this.getClearOptions();

    res.cookie(accessCookieName, '', clearOptions);
    res.cookie(refreshCookieName, '', clearOptions);
  }

  /**
   * Extract JWT tokens from request cookies
   */
  static extractJWTFromCookies(req: Request): {
    accessToken: string | null;
    refreshToken: string | null;
  } {
    const accessCookieName = this.getName('jwt_access');
    const refreshCookieName = this.getName('jwt_refresh');

    // Try signed cookies first (more secure)
    const accessToken =
      req.signedCookies?.[accessCookieName] || req.cookies?.[accessCookieName] || null;
    const refreshToken =
      req.signedCookies?.[refreshCookieName] || req.cookies?.[refreshCookieName] || null;

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Validate cookie configuration
   */
  static validateConfig(): void {
    if (isProduction) {
      // In production, ensure secure cookies
      if (!cookieConfig.session.secure) {
        logger.warn('⚠️  Session cookies should be secure in production');
      }
      if (!cookieConfig.auth.secure) {
        logger.warn('⚠️  Auth cookies should be secure in production');
      }
    }

    // Validate max ages
    Object.entries(cookieConfig).forEach(([type, config]) => {
      if (config.maxAge && config.maxAge < 0) {
        throw new Error(`Invalid maxAge for ${type} cookie: ${config.maxAge}`);
      }
    });

    // JWT-specific validations
    if (isProduction) {
      // Warn about long JWT access token expiry in production
      if (cookieConfig.jwt_access.maxAge && cookieConfig.jwt_access.maxAge > 3600000) {
        // 1 hour
        logger.warn('⚠️  JWT access token cookie expiry is longer than 1 hour in production');
      }

      // Ensure JWT cookies are secure in production
      if (!cookieConfig.jwt_access.secure) {
        logger.warn('⚠️  JWT access token cookies should be secure in production');
      }
      if (!cookieConfig.jwt_refresh.secure) {
        logger.warn(' ⚠️  JWT access token cookies should be secure in production');
      }
    }
  }
}

// Initialize and validate configuration
CookieUtils.validateConfig();

export default cookieConfig;
