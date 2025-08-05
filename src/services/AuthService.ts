import { UserService } from './UserService';
import { JWTUtils } from '@/utils/jwt';
import { logger } from '@/utils/logger';
import { PasswordUtils } from '@/utils/password';
import { LoginAttemptService } from './LoginAttemptService';
import { mailer } from '@/config/mailer';
import {
  LoginCredentials,
  LoginResponse,
  RefreshTokenResponse,
  VerificationTokenRequest,
  VerificationTokenResponse,
  AuthenticatedUser,
  JWTPayload,
  JWTUser,
  AuthServiceInterface,
} from '@/types/jwt';
import { User, CreateUserRequest } from '@/types';
import { createResourceConflictError, createError } from '@/utils/errors';
import { ErrorCodes } from '@/types/errors';

export class AuthService implements AuthServiceInterface {
  private readonly userService: UserService;
  private readonly loginAttemptService: LoginAttemptService;

  constructor() {
    this.userService = new UserService();
    this.loginAttemptService = new LoginAttemptService();
  }

  /**
   * Register a new user with email verification
   */
  async register(userData: CreateUserRequest): Promise<User> {
    try {
      logger.info(`Registration attempt for email: ${userData.email}`);

      // Check if email already exists
      const existingUserByEmail = await this.userService.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        throw createResourceConflictError(
          'Email already exists',
          ErrorCodes.EMAIL_ALREADY_EXISTS,
          'A user with this email address is already registered'
        );
      }

      // Create user using UserService
      const newUser = await this.userService.createUser(userData);

      // Generate email verification token
      const verificationToken = await this.generateVerificationToken({
        userId: newUser.id,
        purpose: 'email_verification',
        email: newUser.email,
      });

      // Send welcome email with verification token
      try {
        await mailer.sendWelcomeEmail(newUser.email, newUser.full_name, verificationToken.token);
        logger.info(`Welcome email sent to ${newUser.email}`);
      } catch (emailError) {
        logger.error('Failed to send welcome email:', emailError);
        // Don't fail registration if email fails
      }

      logger.info(`User ${newUser.id} registered successfully`);

      return newUser;
    } catch (error) {
      logger.error('Registration failed:', error);

      // Re-throw AppError instances as they are already properly formatted
      if (error instanceof Error && 'statusCode' in error && 'errorCode' in error) {
        throw error;
      }

      // For other errors, throw a generic registration error
      throw createResourceConflictError(
        'Registration failed',
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'An unexpected error occurred during registration'
      );
    }
  }

  /**
   * Authenticate user and generate JWT tokens with enhanced security
   */
  async login(credentials: LoginCredentials, clientIp?: string): Promise<LoginResponse> {
    try {
      const { email, password } = credentials;

      logger.info(`Login attempt for email: ${email}`);

      // Get client IP for rate limiting
      const ip = clientIp || this.getClientIp();

      // Check if IP is blocked
      if (await this.loginAttemptService.isIpBlocked(ip)) {
        throw createError(
          'Too many failed login attempts from this IP. Please try again later.',
          429,
          ErrorCodes.RATE_LIMIT_EXCEEDED
        );
      }

      // Check if email is blocked
      if (await this.loginAttemptService.isEmailBlocked(email)) {
        throw createError(
          'Too many failed login attempts for this email. Please try again later.',
          429,
          ErrorCodes.RATE_LIMIT_EXCEEDED
        );
      }

      // Validate user credentials using existing UserService
      const user = await this.validateUserCredentials(email, password);

      if (!user) {
        // Record failed attempt
        await this.loginAttemptService.recordAttempt({
          email,
          ipAddress: ip,
          success: false,
          failureReason: 'Invalid credentials',
        });

        throw createError('Invalid email or password', 401, ErrorCodes.INVALID_CREDENTIALS);
      }

      if (!user.is_active) {
        // Record failed attempt
        await this.loginAttemptService.recordAttempt({
          userId: user.id,
          email,
          ipAddress: ip,
          success: false,
          failureReason: 'Account deactivated',
        });

        throw createError('Account is deactivated', 401, ErrorCodes.UNAUTHORIZED);
      }

      // Record successful attempt
      await this.loginAttemptService.recordAttempt({
        userId: user.id,
        email,
        ipAddress: ip,
        success: true,
      });

      // Create JWT user object
      const jwtUser: JWTUser = {
        id: user.id,
        email: user.email,
        role: 'user', // Default role, can be extended based on user data
      };

      // Generate token pair
      const tokens = JWTUtils.generateTokenPair(jwtUser);

      // Update user's last login timestamp
      await this.updateLastLogin(user.id);

      // Create authenticated user response
      const authenticatedUser: AuthenticatedUser = {
        id: user.id,
        email: user.email,
        role: 'user',
        isActive: user.is_active,
      };

      logger.info(`User ${user.id} logged in successfully`);

      return {
        user: authenticatedUser,
        tokens,
        message: 'Login successful',
      };
    } catch (error) {
      logger.error('Login failed:', error);

      if (error instanceof Error && 'statusCode' in error && 'errorCode' in error) {
        throw error;
      }

      throw createError('Login failed', 500, ErrorCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get client IP address
   */
  private getClientIp(): string {
    // This should be called from a request context
    // For now, return a placeholder
    return 'unknown';
  }

  /**
   * Logout user (invalidate tokens)
   */
  async logout(userId: string): Promise<void> {
    try {
      logger.info(`Logout for user: ${userId}`);

      // In a stateless JWT system, logout is primarily handled client-side
      // by clearing cookies/tokens. However, we can log the event and
      // potentially implement token blacklisting in the future.

      // For now, we'll just log the logout event
      logger.info(`User ${userId} logged out successfully`);
    } catch (error) {
      logger.error('Logout failed:', error);
      throw createError('Logout failed', 500);
    }
  }

  /**
   * Refresh JWT tokens using a valid refresh token
   */
  async refreshTokens(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      logger.debug('Token refresh attempt');

      // Use JWT utility to refresh tokens
      const newTokens = JWTUtils.refreshTokens(refreshToken);

      logger.info('Tokens refreshed successfully');

      return {
        tokens: newTokens,
        message: 'Tokens refreshed successfully',
      };
    } catch (error) {
      logger.error('Token refresh failed:', error);

      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }

      throw createError('Token refresh failed', 401);
    }
  }

  /**
   * Generate verification token for email verification, password reset, etc.
   */
  async generateVerificationToken(
    request: VerificationTokenRequest
  ): Promise<VerificationTokenResponse> {
    try {
      const { userId, purpose, email } = request;

      logger.info(`Generating verification token for user ${userId}, purpose: ${purpose}`);

      // Generate token with 1-hour expiration for password reset
      const expiresIn = purpose === 'password_reset' ? '1h' : '24h';
      const token = JWTUtils.generateVerificationToken(userId, purpose, email, expiresIn);

      // Calculate expiration time
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + (purpose === 'password_reset' ? 1 : 24));

      logger.info(`Verification token generated for user ${userId}, expires at ${expiresAt}`);

      return {
        token,
        expiresAt,
        message: 'Verification token generated successfully',
      };
    } catch (error) {
      logger.error('Failed to generate verification token:', error);
      throw createError(
        'Failed to generate verification token',
        500,
        ErrorCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Forgot password - send reset email with rate limiting
   */
  async forgotPassword(email: string, clientIp: string): Promise<void> {
    try {
      logger.info(`Forgot password request for email: ${email}, IP: ${clientIp}`);

      // Check rate limiting for password reset requests
      if (await this.loginAttemptService.isEmailBlocked(email)) {
        logger.warn(`Password reset blocked for email: ${email} due to rate limiting`);
        // Don't reveal if email exists or not for security
        return;
      }

      // Find user by email
      const user = await this.userService.getUserByEmail(email);
      if (!user) {
        logger.info(`Password reset requested for non-existent email: ${email}`);
        // Don't reveal if email exists or not for security
        return;
      }

      // Check if user is active
      if (!user.is_active) {
        logger.warn(`Password reset requested for inactive user: ${user.id}`);
        // Don't reveal if email exists or not for security
        return;
      }

      // Generate password reset token
      const resetToken = await this.generateVerificationToken({
        userId: user.id,
        purpose: 'password_reset',
        email: user.email,
      });

      // Send password reset email
      try {
        await mailer.sendPasswordResetEmail(user.email, user.full_name, resetToken.token);
        logger.info(`Password reset email sent to ${user.email}`);

        // Record the attempt (successful)
        await this.loginAttemptService.recordAttempt({
          userId: user.id,
          email,
          ipAddress: clientIp,
          success: true,
        });
      } catch (emailError) {
        logger.error('Failed to send password reset email:', emailError);
        throw createError('Failed to send password reset email', 500, ErrorCodes.EMAIL_SEND_FAILED);
      }
    } catch (error) {
      logger.error('Forgot password failed:', error);

      // Re-throw AppError instances as they are already properly formatted
      if (error instanceof Error && 'statusCode' in error && 'errorCode' in error) {
        throw error;
      }

      // For other errors, throw a generic error
      throw createError(
        'Failed to process password reset request',
        500,
        ErrorCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Verify a verification token
   */
  async verifyToken(token: string, purpose?: string): Promise<JWTPayload> {
    try {
      logger.debug(`Verifying ${purpose || 'verification'} token`);

      // Verify the token using JWT utility
      const payload = JWTUtils.verifyVerificationToken(token, purpose);

      logger.info(`${purpose || 'Verification'} token verified for user ${payload.sub}`);

      return payload;
    } catch (error) {
      logger.error('Token verification failed:', error);

      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }

      throw createError('Token verification failed', 401);
    }
  }

  /**
   * Get user information from JWT token
   */
  async getUserFromToken(token: string): Promise<AuthenticatedUser | null> {
    try {
      // Verify and decode the token
      const payload = JWTUtils.verifyToken(token, 'access');

      // Get full user information from database
      const user = await this.userService.getUserById(payload.sub);
      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        role: 'user', // Default role, can be extended
        isActive: user.is_active,
      };
    } catch (error) {
      logger.debug(
        'Failed to get user from token:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return null;
    }
  }

  /**
   * Change user password (requires current password verification)
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      logger.info(`Password change attempt for user: ${userId}`);

      // Get user from database first to get email
      const user = await this.userService.getUserById(userId);
      if (!user) {
        throw createError('User not found', 404);
      }

      // Get user from database with password hash
      const userWithPassword = await this.userService.getUserByEmailWithPassword(user.email);
      if (!userWithPassword) {
        throw createError('User not found', 404);
      }

      // Verify current password
      const isCurrentPasswordValid = await PasswordUtils.verifyPassword(
        currentPassword,
        userWithPassword.password_hash
      );
      if (!isCurrentPasswordValid) {
        throw createError('Current password is incorrect', 401);
      }

      // Update password using UserService
      await this.userService.updateUser(userId, { password: newPassword });

      logger.info(`Password changed successfully for user ${userId}`);
    } catch (error) {
      logger.error('Password change failed:', error);

      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }

      throw createError('Password change failed', 500);
    }
  }

  /**
   * Reset password using verification token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      logger.info('Password reset attempt');

      // Verify the reset token
      const payload = await this.verifyToken(token, 'password_reset');

      // Get user details for confirmation email
      const user = await this.userService.getUserById(payload.sub);
      if (!user) {
        throw createError('User not found', 404);
      }

      // Update password
      await this.userService.updateUser(payload.sub, { password: newPassword });

      // Send confirmation email
      try {
        await mailer.sendPasswordResetConfirmationEmail(user.email, user.full_name);
        logger.info(`Password reset confirmation email sent to ${user.email}`);
      } catch (emailError) {
        logger.error('Failed to send password reset confirmation email:', emailError);
        // Don't fail the password reset if email fails
      }

      logger.info(`Password reset successfully for user ${payload.sub}`);
    } catch (error) {
      logger.error('Password reset failed:', error);

      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }

      throw createError('Password reset failed', 500);
    }
  }

  /**
   * Validate user credentials (private method)
   */
  private async validateUserCredentials(email: string, password: string): Promise<User | null> {
    try {
      // Get user by email with password hash using UserService
      const userWithPassword = await this.userService.getUserByEmailWithPassword(email);

      if (!userWithPassword) {
        return null;
      }

      // Verify password using PasswordUtils
      const isPasswordValid = await PasswordUtils.verifyPassword(
        password,
        userWithPassword.password_hash
      );

      if (!isPasswordValid) {
        return null;
      }

      // Return user without password hash
      const user: User = {
        id: userWithPassword.id,
        email: userWithPassword.email,
        password_hash: userWithPassword.password_hash,
        full_name: userWithPassword.full_name,
        phone: userWithPassword.phone,
        whatsapp_number: userWithPassword.whatsapp_number,
        subscription_plan: userWithPassword.subscription_plan,
        subscription_expires_at: userWithPassword.subscription_expires_at,
        is_active: userWithPassword.is_active,
        created_at: userWithPassword.created_at,
        updated_at: userWithPassword.updated_at,
        ...(userWithPassword.last_login && { last_login: userWithPassword.last_login }),
      };
      return user;
    } catch (error) {
      logger.error('Credential validation failed:', error);
      return null;
    }
  }

  /**
   * Update user's last login timestamp (private method)
   */
  private async updateLastLogin(userId: string): Promise<void> {
    try {
      await this.userService.updateUser(userId, {
        last_login: new Date(),
      });
    } catch (error) {
      // Don't fail the login if we can't update last_login
      logger.warn('Failed to update last login timestamp:', error);
    }
  }

  /**
   * Validate token and get user (utility method for middleware)
   */
  async validateTokenAndGetUser(token: string): Promise<AuthenticatedUser | null> {
    try {
      return await this.getUserFromToken(token);
    } catch (error) {
      logger.debug(
        'Token validation failed:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return null;
    }
  }

  /**
   * Check if user has specific role (utility method)
   */
  async userHasRole(userId: string, role: string): Promise<boolean> {
    try {
      const user = await this.userService.getUserById(userId);
      if (!user) {
        return false;
      }

      // TODO: Implement proper role checking based on your user model
      // For now, return true for 'user' role
      return role === 'user';
    } catch (error) {
      logger.error('Role check failed:', error);
      return false;
    }
  }
}
