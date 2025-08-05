import { Request, Response } from 'express';
import { AuthService } from '@/services/AuthService';
import { AuthValidator } from '@/validators/authValidator';
import { LoginValidator } from '@/validators/loginValidator';
import { AuthResource } from '@/resources/authResource';
import { LoginResource } from '@/resources/loginResource';
import { createSuccessResponse } from '@/utils/response';
import { asyncHandler } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';
import { formatValidationErrorResponse } from '@/utils/errors';

export class AuthController {
  private readonly authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Get client IP address from request
   */
  private getClientIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string) ||
      (req.headers['x-real-ip'] as string) ||
      req.socket.remoteAddress ||
      req.ip ||
      'unknown'
    );
  }

  /**
   * Register a new user with enhanced security
   */
  register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    logger.info('Registration request received');

    // Sanitize and validate request data
    const sanitizedData = AuthValidator.sanitizeRegisterData(req.body);
    const validation = AuthValidator.validateRegisterRequest(sanitizedData);

    if (!validation.isValid) {
      logger.warn('Registration validation failed:', validation.errors);
      res.status(400).json(formatValidationErrorResponse('Validation failed', validation.errors));
      return;
    }

    // Register user with email verification
    const newUser = await this.authService.register(sanitizedData);

    // Format response
    const userData = AuthResource.formatRegisterResponse(newUser);
    const successResponse = createSuccessResponse(
      'User registered successfully. Please check your email for verification.',
      userData
    );

    logger.info(`User ${newUser.id} registered successfully`);

    res.status(201).json(successResponse);
  });

  /**
   * Login user with enhanced security
   */
  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    logger.info('Login request received');

    // Sanitize and validate request data
    const sanitizedData = LoginValidator.sanitizeLoginData(req.body);
    const validation = LoginValidator.validateLoginRequest(sanitizedData);

    if (!validation.isValid) {
      logger.warn('Login validation failed:', validation.errors);
      res.status(400).json(formatValidationErrorResponse('Validation failed', validation.errors));
      return;
    }

    // Get client IP for rate limiting
    const clientIp = this.getClientIp(req);

    // Login user with enhanced security
    const loginData = await this.authService.login(
      {
        email: sanitizedData.email,
        password: sanitizedData.password,
        ...(sanitizedData.remember_me !== undefined && { rememberMe: sanitizedData.remember_me }),
      },
      clientIp
    );

    // Get full user data for response
    const user = await this.authService.getUserFromToken(loginData.tokens.accessToken);
    if (!user) {
      logger.error('Failed to get user data after login');
      res.status(500).json({ error: 'Internal server error' });
      return;
    }

    // Get complete user data from database
    const userService = new (await import('@/services/UserService')).UserService();
    const fullUser = await userService.getUserById(user.id);

    if (!fullUser) {
      logger.error('Failed to get full user data after login');
      res.status(500).json({ error: 'Internal server error' });
      return;
    }

    // Format response
    const responseData = LoginResource.formatLoginResponse(loginData, fullUser);
    const successResponse = createSuccessResponse('Login successful', responseData);

    logger.info(`User ${user.id} logged in successfully`);

    res.status(200).json(successResponse);
  });

  /**
   * Logout user
   */
  logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    logger.info('Logout request received');

    // Get user ID from JWT token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const user = await this.authService.getUserFromToken(token);
    if (!user) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    // Logout user
    await this.authService.logout(user.id);

    const successResponse = createSuccessResponse('Logout successful');

    logger.info(`User ${user.id} logged out successfully`);

    res.status(200).json(successResponse);
  });

  /**
   * Refresh access token using refresh token
   */
  refreshTokens = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    logger.info('Token refresh request received');

    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token is required' });
      return;
    }

    const tokens = await this.authService.refreshTokens(refreshToken);

    res.status(200).json({
      message: 'Tokens refreshed successfully',
      data: tokens,
    });
  });

  /**
   * Forgot password - send reset email
   */
  forgotPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    logger.info('Forgot password request received');

    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    // Get client IP for rate limiting
    const clientIp = this.getClientIp(req);

    // Send password reset email
    await this.authService.forgotPassword(email, clientIp);

    res.status(200).json({
      message: 'If an account with that email exists, a password reset link has been sent.',
      data: null,
    });
  });

  /**
   * Reset password using token
   */
  resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    logger.info('Reset password request received');

    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ error: 'Token and new password are required' });
      return;
    }

    // Reset password
    await this.authService.resetPassword(token, newPassword);

    res.status(200).json({
      message: 'Password has been reset successfully. You can now login with your new password.',
      data: null,
    });
  });

  /**
   * Verify email using verification token
   */
  verifyEmail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    logger.info('Email verification request received');

    const { token } = req.body;

    if (!token) {
      res.status(400).json({ error: 'Verification token is required' });
      return;
    }

    // Verify email
    await this.authService.verifyEmail(token);

    res.status(200).json({
      message: 'Email verified successfully. You can now login to your account.',
      data: null,
    });
  });
}
