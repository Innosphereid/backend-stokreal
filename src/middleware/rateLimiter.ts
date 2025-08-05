import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import { createError } from '@/utils/errors';
import { ErrorCodes } from '@/types/errors';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum number of requests per window
  message?: string;
  statusCode?: number;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Get client identifier (IP address)
   */
  private getClientId(req: Request): string {
    // Get IP from various headers (for proxy scenarios)
    const ip =
      req.headers['x-forwarded-for'] ||
      req.headers['x-real-ip'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.ip ||
      'unknown';

    return Array.isArray(ip) ? ip[0] || 'unknown' : ip || 'unknown';
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key] && this.store[key].resetTime <= now) {
        delete this.store[key];
      }
    });
  }

  /**
   * Rate limiting middleware
   */
  middleware = (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Clean up expired entries
      this.cleanup();

      const clientId = this.getClientId(req);
      const now = Date.now();

      // Get or create client record
      if (!this.store[clientId]) {
        this.store[clientId] = {
          count: 0,
          resetTime: now + this.config.windowMs,
        };
      }

      const clientRecord = this.store[clientId];

      // Check if window has reset
      if (now > clientRecord.resetTime) {
        clientRecord.count = 0;
        clientRecord.resetTime = now + this.config.windowMs;
      }

      // Increment request count
      clientRecord.count++;

      // Check if limit exceeded
      if (clientRecord.count > this.config.maxRequests) {
        logger.warn(`Rate limit exceeded for IP: ${clientId}`, {
          count: clientRecord.count,
          maxRequests: this.config.maxRequests,
          windowMs: this.config.windowMs,
        });

        const error = createError(
          this.config.message || 'Too many requests',
          this.config.statusCode || 429,
          ErrorCodes.RATE_LIMIT_EXCEEDED
        );

        res.status(error.statusCode).json({
          error: error.message,
          errorCode: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((clientRecord.resetTime - now) / 1000),
        });
        return;
      }

      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': this.config.maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(
          0,
          this.config.maxRequests - clientRecord.count
        ).toString(),
        'X-RateLimit-Reset': new Date(clientRecord.resetTime).toISOString(),
      });

      next();
    } catch (error) {
      logger.error('Rate limiting error:', error);
      next(); // Continue on error to avoid blocking requests
    }
  };
}

/**
 * Create rate limiting middleware for registration (3 attempts per hour per IP)
 */
export const registrationRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3,
  message: 'Too many registration attempts. Please try again later.',
  statusCode: 429,
}).middleware;

/**
 * Create rate limiting middleware for login (5 attempts per 15 minutes per IP)
 */
export const loginRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  message: 'Too many login attempts. Please try again later.',
  statusCode: 429,
}).middleware;

/**
 * Create rate limiting middleware for password reset (3 attempts per hour per email)
 */
export const passwordResetRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3,
  message: 'Too many password reset attempts. Please try again later.',
  statusCode: 429,
}).middleware;

export { RateLimiter };
