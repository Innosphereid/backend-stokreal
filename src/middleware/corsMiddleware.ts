import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import { CorsUtils } from '@/config/cors';

/**
 * CORS logging middleware
 * Logs CORS-related information for debugging and monitoring
 */
export const corsLoggingMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const origin = req.get('Origin');
  const method = req.method;
  const isPreflightRequest = method === 'OPTIONS';

  // Log CORS requests in development
  if (process.env.NODE_ENV === 'development' && origin) {
    const isAllowed = CorsUtils.isOriginAllowed(origin);

    logger.info('CORS Request', {
      origin,
      method,
      path: req.path,
      isPreflightRequest,
      isOriginAllowed: isAllowed,
      userAgent: req.get('User-Agent'),
    });

    if (!isAllowed) {
      logger.warn('CORS: Origin not allowed', { origin, path: req.path });
    }
  }

  // Log preflight requests
  if (isPreflightRequest && origin) {
    const requestedMethod = req.get('Access-Control-Request-Method');
    const requestedHeaders = req.get('Access-Control-Request-Headers');

    logger.info('CORS Preflight Request', {
      origin,
      requestedMethod,
      requestedHeaders: requestedHeaders ? requestedHeaders.split(',').map(h => h.trim()) : null,
      path: req.path,
    });
  }

  next();
};

/**
 * CORS security middleware
 * Adds additional security checks for CORS requests
 */
export const corsSecurityMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const origin = req.get('Origin');

  // Add security headers for CORS responses
  if (origin) {
    // Add Vary header to indicate that the response varies based on Origin
    res.vary('Origin');

    // Add security headers
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    res.set('X-XSS-Protection', '1; mode=block');
  }

  // Block requests from suspicious origins in production
  if (process.env.NODE_ENV === 'production' && origin) {
    const suspiciousPatterns = [
      /localhost/i,
      /127\.0\.0\.1/i,
      /192\.168\./i,
      /10\./i,
      /172\.(1[6-9]|2[0-9]|3[0-1])\./i, // Private IP ranges
    ];

    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(origin));

    if (isSuspicious) {
      logger.warn('CORS: Suspicious origin detected in production', {
        origin,
        path: req.path,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
      });

      // Optionally block the request
      if (process.env.CORS_BLOCK_SUSPICIOUS === 'true') {
        res.status(403).json({
          error: 'Forbidden',
          message: 'Origin not allowed',
        });
        return;
      }
    }
  }

  next();
};

/**
 * CORS metrics middleware
 * Tracks CORS-related metrics for monitoring
 */
export const corsMetricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const origin = req.get('Origin');

  if (origin) {
    // Track CORS requests (you can integrate with your metrics system)
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      // Log metrics (integrate with your preferred metrics system)
      logger.info('CORS Metrics', {
        origin,
        method: req.method,
        path: req.path,
        statusCode,
        duration,
        isPreflightRequest: req.method === 'OPTIONS',
        timestamp: new Date().toISOString(),
      });
    });
  }

  next();
};

/**
 * Combined CORS middleware
 * Applies all CORS-related middleware in the correct order
 */
export const corsMiddleware = [
  corsLoggingMiddleware,
  corsSecurityMiddleware,
  corsMetricsMiddleware,
];
