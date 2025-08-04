import { Request, Response, NextFunction } from 'express';
import { JWTUtils, TokenMissingError, TokenInvalidError } from '@/utils/jwt';
import { logger } from '@/utils/logger';
import {
  AuthenticatedRequest,
  JWTMiddlewareOptions,
  TokenSource,
  TokenExtractionResult,
} from '@/types/jwt';

/**
 * Extract JWT token from various sources
 */
export class TokenExtractor {
  /**
   * Extract token from Authorization header
   */
  static fromHeader(req: Request): TokenExtractionResult {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return { token: null, source: null };
    }

    if (!authHeader.startsWith('Bearer ')) {
      return {
        token: null,
        source: null,
        error: 'Authorization header must start with "Bearer "',
      };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return {
        token: null,
        source: null,
        error: 'No token provided in Authorization header',
      };
    }

    return { token, source: 'header' };
  }

  /**
   * Extract token from cookies
   */
  static fromCookies(req: Request): TokenExtractionResult {
    // Try signed cookies first (more secure)
    const signedAccessToken = req.signedCookies?.jwt_access;
    if (signedAccessToken) {
      return { token: signedAccessToken, source: 'cookie' };
    }

    // Fallback to regular cookies
    const accessToken = req.cookies?.jwt_access;
    if (accessToken) {
      return { token: accessToken, source: 'cookie' };
    }

    // Check for auth token cookie (backward compatibility)
    const authToken = req.signedCookies?.auth_token || req.cookies?.auth_token;
    if (authToken) {
      return { token: authToken, source: 'cookie' };
    }

    return { token: null, source: null };
  }

  /**
   * Extract token from query parameters (less secure, use with caution)
   */
  static fromQuery(req: Request): TokenExtractionResult {
    const token = req.query.token as string;

    if (!token) {
      return { token: null, source: null };
    }

    return { token, source: 'query' };
  }

  /**
   * Extract token from request body (for POST requests)
   */
  static fromBody(req: Request): TokenExtractionResult {
    const token = req.body?.token;

    if (!token || typeof token !== 'string') {
      return { token: null, source: null };
    }

    return { token, source: 'body' };
  }

  /**
   * Extract token from multiple sources in order of preference
   */
  static extractToken(
    req: Request,
    sources: TokenSource[] = ['header', 'cookie']
  ): TokenExtractionResult {
    for (const source of sources) {
      let result: TokenExtractionResult;

      switch (source) {
        case 'header':
          result = this.fromHeader(req);
          break;
        case 'cookie':
          result = this.fromCookies(req);
          break;
        case 'query':
          result = this.fromQuery(req);
          break;
        case 'body':
          result = this.fromBody(req);
          break;
        default:
          continue;
      }

      if (result.token) {
        return result;
      }

      // If there was an error with this source, return it
      if (result.error) {
        return result;
      }
    }

    return { token: null, source: null };
  }
}

/**
 * JWT Authentication middleware
 */
export class JWTMiddleware {
  /**
   * Required authentication middleware
   */
  static authenticateToken(options: JWTMiddlewareOptions = {}) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { tokenTypes = ['access'], roles = [] } = options;

        // Extract token from request
        const extraction = TokenExtractor.extractToken(req);

        if (!extraction.token) {
          const location = extraction.source || 'header or cookies';
          throw new TokenMissingError(location);
        }

        if (extraction.error) {
          throw new TokenInvalidError(extraction.error);
        }

        // Verify the token
        const payload = JWTUtils.verifyToken(extraction.token);

        // Check if token type is allowed
        if (!tokenTypes.includes(payload.type)) {
          throw new TokenInvalidError(`Token type ${payload.type} not allowed for this endpoint`);
        }

        // Extract user information
        const user = JWTUtils.extractUser(payload);

        // Check role-based access if roles are specified
        if (roles.length > 0 && user.role && !roles.includes(user.role)) {
          throw new TokenInvalidError(
            `Insufficient permissions. Required roles: ${roles.join(', ')}`
          );
        }

        // Attach user and token info to request
        req.user = user;
        req.token = extraction.token;
        req.tokenType = payload.type;

        logger.debug(
          `Authenticated user ${user.id} with ${payload.type} token from ${extraction.source}`
        );

        next();
      } catch (error) {
        logger.warn('JWT authentication failed:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          url: req.url,
          method: req.method,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        });

        next(error);
      }
    };
  }

  /**
   * Optional authentication middleware (doesn't fail if no token)
   */
  static optionalAuthentication(options: JWTMiddlewareOptions = {}) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { tokenTypes = ['access'] } = options;

        // Extract token from request
        const extraction = TokenExtractor.extractToken(req);

        // If no token found, continue without authentication
        if (!extraction.token) {
          logger.debug('No token found for optional authentication');
          return next();
        }

        // If there was an extraction error, log it but continue
        if (extraction.error) {
          logger.debug('Token extraction error in optional auth:', extraction.error);
          return next();
        }

        try {
          // Verify the token
          const payload = JWTUtils.verifyToken(extraction.token);

          // Check if token type is allowed
          if (tokenTypes.includes(payload.type)) {
            // Extract user information
            const user = JWTUtils.extractUser(payload);

            // Attach user and token info to request
            req.user = user;
            req.token = extraction.token;
            req.tokenType = payload.type;

            logger.debug(`Optionally authenticated user ${user.id} with ${payload.type} token`);
          }
        } catch (tokenError) {
          // Log token verification errors but don't fail the request
          logger.debug(
            'Token verification failed in optional auth:',
            tokenError instanceof Error ? tokenError.message : 'Unknown error'
          );
        }

        next();
      } catch (error) {
        // In optional authentication, we should never fail the request
        logger.warn('Unexpected error in optional authentication:', error);
        next();
      }
    };
  }

  /**
   * Role-based access control middleware
   */
  static requireRole(roles: string | string[]) {
    const requiredRoles = Array.isArray(roles) ? roles : [roles];

    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      try {
        // Check if user is authenticated
        if (!req.user) {
          throw new TokenMissingError('authentication required for role check');
        }

        // Check if user has required role
        if (!req.user.role || !requiredRoles.includes(req.user.role)) {
          throw new TokenInvalidError(
            `Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`
          );
        }

        logger.debug(`Role check passed for user ${req.user.id} with role ${req.user.role}`);
        next();
      } catch (error) {
        logger.warn('Role check failed:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          userId: req.user?.id,
          userRole: req.user?.role,
          requiredRoles,
          url: req.url,
          method: req.method,
        });

        next(error);
      }
    };
  }

  /**
   * Refresh token middleware (specifically for refresh token endpoints)
   */
  static requireRefreshToken() {
    return this.authenticateToken({ tokenTypes: ['refresh'] });
  }

  /**
   * Verification token middleware (for email verification, password reset, etc.)
   */
  static requireVerificationToken(purpose?: string) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        // Extract token from request
        const extraction = TokenExtractor.extractToken(req);

        if (!extraction.token) {
          throw new TokenMissingError(extraction.source || 'header or cookies');
        }

        if (extraction.error) {
          throw new TokenInvalidError(extraction.error);
        }

        // Verify as verification token with optional purpose check
        const payload = JWTUtils.verifyVerificationToken(extraction.token, purpose);

        // Extract user information
        const user = JWTUtils.extractUser(payload);

        // Attach user and token info to request
        req.user = user;
        req.token = extraction.token;
        req.tokenType = payload.type;

        logger.debug(`Verified ${purpose || 'verification'} token for user ${user.id}`);

        next();
      } catch (error) {
        logger.warn('Verification token check failed:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          purpose,
          url: req.url,
          method: req.method,
        });

        next(error);
      }
    };
  }
}

// Export middleware functions for convenience
export const authenticateToken = JWTMiddleware.authenticateToken;
export const optionalAuthentication = JWTMiddleware.optionalAuthentication;
export const requireRole = JWTMiddleware.requireRole;
export const requireRefreshToken = JWTMiddleware.requireRefreshToken;
export const requireVerificationToken = JWTMiddleware.requireVerificationToken;

// Export default middleware (required authentication)
export default JWTMiddleware.authenticateToken;
