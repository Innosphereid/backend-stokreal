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
   * Register a new user
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

    // Register user
    const newUser = await this.authService.register(sanitizedData);

    // Format response
    const userData = AuthResource.formatRegisterResponse(newUser);
    const successResponse = createSuccessResponse('User registered successfully', userData);

    logger.info(`User ${newUser.id} registered successfully`);

    res.status(201).json(successResponse);
  });

  /**
   * Login user
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

    // Login user
    const loginData = await this.authService.login({
      email: sanitizedData.email,
      password: sanitizedData.password,
      ...(sanitizedData.remember_me !== undefined && { rememberMe: sanitizedData.remember_me }),
    });

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
}
