import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { CookieUtils, cookieNames } from '@/config/cookies';

export class CookieController {
  // Set a test cookie
  setCookie = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name, value, type = 'session' } = req.body;

    if (!name || !value) {
      const errorResponse = createErrorResponse('Cookie name and value are required');
      res.status(400).json(errorResponse);
      return;
    }

    // Use the utility method from middleware
    res.setCookie(name, value, type as keyof typeof cookieNames);

    const response = createSuccessResponse('Cookie set successfully', {
      name,
      value,
      type,
      options: CookieUtils.getOptions(type),
    });
    res.status(200).json(response);
  });

  // Get all cookies
  getCookies = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const response = createSuccessResponse('Cookies retrieved successfully', {
      cookies: req.cookies,
      signedCookies: req.signedCookies,
    });
    res.status(200).json(response);
  });

  // Clear a specific cookie
  clearCookie = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name } = req.params;

    if (!name) {
      const errorResponse = createErrorResponse('Cookie name is required');
      res.status(400).json(errorResponse);
      return;
    }

    res.clearCookie(name);

    const response = createSuccessResponse('Cookie cleared successfully', { name });
    res.status(200).json(response);
  });

  // Set authentication cookie (example)
  setAuthCookie = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { token } = req.body;

    if (!token) {
      const errorResponse = createErrorResponse('Auth token is required');
      res.status(400).json(errorResponse);
      return;
    }

    res.setAuthCookie(token);

    const response = createSuccessResponse('Auth cookie set successfully', {
      cookieName: CookieUtils.getName('auth'),
      options: CookieUtils.getOptions('auth'),
    });
    res.status(200).json(response);
  });

  // Clear authentication cookie
  clearAuthCookie = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    res.clearAuthCookie();

    const response = createSuccessResponse('Auth cookie cleared successfully');
    res.status(200).json(response);
  });

  // Set session cookie (example)
  setSessionCookie = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { sessionId } = req.body;

    if (!sessionId) {
      const errorResponse = createErrorResponse('Session ID is required');
      res.status(400).json(errorResponse);
      return;
    }

    res.setSessionCookie(sessionId);

    const response = createSuccessResponse('Session cookie set successfully', {
      cookieName: CookieUtils.getName('session'),
      options: CookieUtils.getOptions('session'),
    });
    res.status(200).json(response);
  });

  // Clear session cookie
  clearSessionCookie = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    res.clearSessionCookie();

    const response = createSuccessResponse('Session cookie cleared successfully');
    res.status(200).json(response);
  });

  // Get cookie configuration
  getCookieConfig = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const response = createSuccessResponse('Cookie configuration retrieved successfully', {
      names: cookieNames,
      config: {
        session: CookieUtils.getOptions('session'),
        auth: CookieUtils.getOptions('auth'),
        csrf: CookieUtils.getOptions('csrf'),
        remember: CookieUtils.getOptions('remember'),
      },
    });
    res.status(200).json(response);
  });

  // Validate current cookies
  validateCookies = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authToken = req.authToken;
    const sessionId = req.sessionId;

    const response = createSuccessResponse('Cookie validation completed', {
      hasAuthToken: !!authToken,
      hasSessionId: !!sessionId,
      authToken: authToken ? 'Present (hidden for security)' : null,
      sessionId: sessionId ? 'Present (hidden for security)' : null,
    });
    res.status(200).json(response);
  });
}
