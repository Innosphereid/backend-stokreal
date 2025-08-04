import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { CorsUtils } from '@/config/cors';

export class CorsController {
  // Get CORS configuration
  getCorsConfig = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const config = CorsUtils.getConfigSummary();

    const response = createSuccessResponse('CORS configuration retrieved successfully', config);
    res.status(200).json(response);
  });

  // Check if origin is allowed
  checkOrigin = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { origin } = req.body;

    if (!origin) {
      const errorResponse = createErrorResponse('Origin is required');
      res.status(400).json(errorResponse);
      return;
    }

    const isAllowed = CorsUtils.isOriginAllowed(origin);

    const response = createSuccessResponse('Origin check completed', {
      origin,
      isAllowed,
      currentOrigin: req.get('Origin') || null,
    });
    res.status(200).json(response);
  });

  // Get allowed origins
  getAllowedOrigins = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const allowedOrigins = CorsUtils.getAllowedOrigins();

    const response = createSuccessResponse('Allowed origins retrieved successfully', {
      allowedOrigins,
      type: typeof allowedOrigins === 'boolean' ? 'boolean' : 'array',
    });
    res.status(200).json(response);
  });

  // Get allowed methods
  getAllowedMethods = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const allowedMethods = CorsUtils.getAllowedMethods();

    const response = createSuccessResponse('Allowed methods retrieved successfully', {
      allowedMethods,
    });
    res.status(200).json(response);
  });

  // Get allowed headers
  getAllowedHeaders = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const allowedHeaders = CorsUtils.getAllowedHeaders();

    const response = createSuccessResponse('Allowed headers retrieved successfully', {
      allowedHeaders,
    });
    res.status(200).json(response);
  });

  // Test CORS preflight
  testPreflight = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const origin = req.get('Origin');
    const method = req.get('Access-Control-Request-Method');
    const headers = req.get('Access-Control-Request-Headers');

    const response = createSuccessResponse('CORS preflight test completed', {
      origin: origin || null,
      requestedMethod: method || null,
      requestedHeaders: headers ? headers.split(',').map(h => h.trim()) : null,
      actualMethod: req.method,
      isPreflightRequest: req.method === 'OPTIONS',
    });
    res.status(200).json(response);
  });

  // Get current request CORS info
  getCurrentRequestInfo = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const origin = req.get('Origin');
    const userAgent = req.get('User-Agent');
    const referer = req.get('Referer');

    const response = createSuccessResponse('Current request CORS info retrieved', {
      origin: origin || null,
      userAgent: userAgent || null,
      referer: referer || null,
      method: req.method,
      headers: {
        origin: req.get('Origin'),
        host: req.get('Host'),
        'access-control-request-method': req.get('Access-Control-Request-Method'),
        'access-control-request-headers': req.get('Access-Control-Request-Headers'),
      },
      isOriginAllowed: origin ? CorsUtils.isOriginAllowed(origin) : null,
    });
    res.status(200).json(response);
  });

  // Validate CORS setup
  validateCorsSetup = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const config = CorsUtils.getConfigSummary();
    const issues: string[] = [];
    const warnings: string[] = [];

    // Check for common issues
    if (config.environment === 'production') {
      if (config.origins === true) {
        issues.push('CORS origin is set to allow all origins in production');
      }

      if (config.credentials && config.origins === true) {
        issues.push('CORS credentials are enabled with wildcard origin in production');
      }

      if (!config.credentials && config.environment === 'production') {
        warnings.push(
          'CORS credentials are disabled in production - this may affect cookie-based authentication'
        );
      }
    }

    if (config.maxAge > 86400) {
      warnings.push('CORS maxAge is greater than 24 hours - some browsers may not respect this');
    }

    const validMethods = ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'];
    const invalidMethods = config.methods.filter(method => !validMethods.includes(method));
    if (invalidMethods.length > 0) {
      issues.push(`Invalid CORS methods detected: ${invalidMethods.join(', ')}`);
    }

    const response = createSuccessResponse('CORS setup validation completed', {
      isValid: issues.length === 0,
      issues,
      warnings,
      config,
    });

    res.status(issues.length > 0 ? 400 : 200).json(response);
  });
}
