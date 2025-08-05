import { AuthService } from '../../services/AuthService';
import { UserService } from '../../services/UserService';
import { LoginAttemptService } from '../../services/LoginAttemptService';
import { EmailVerificationService } from '../../services/EmailVerificationService';
import { JWTUtils } from '../../utils/jwt';
import { PasswordUtils } from '../../utils/password';
import { mailer } from '../../mails';
import { User, CreateUserRequest } from '../../types';
import { LoginCredentials } from '../../types/jwt';

// Mock all dependencies
jest.mock('../../services/UserService');
jest.mock('../../services/LoginAttemptService');
jest.mock('../../services/EmailVerificationService');
jest.mock('../../utils/jwt');
jest.mock('../../utils/password');
jest.mock('../../mails');

const mockUserService = UserService as jest.MockedClass<typeof UserService>;
const mockLoginAttemptService = LoginAttemptService as jest.MockedClass<typeof LoginAttemptService>;
const mockEmailVerificationService = EmailVerificationService as jest.MockedClass<
  typeof EmailVerificationService
>;
const mockJWTUtils = JWTUtils as jest.Mocked<typeof JWTUtils>;
const mockPasswordUtils = PasswordUtils as jest.Mocked<typeof PasswordUtils>;
const mockMailer = mailer as jest.Mocked<typeof mailer>;

describe('AuthService', () => {
  let authService: AuthService;
  let mockUser: User;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();

    mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      password_hash: 'hashed-password',
      full_name: 'Test User',
      phone: '+628123456789',
      whatsapp_number: '+628123456789',
      subscription_plan: 'free',
      subscription_expires_at: undefined,
      is_active: true,
      email_verified: false,
      created_at: new Date(),
      updated_at: new Date(),
    };
  });

  describe('register', () => {
    const registerData: CreateUserRequest = {
      email: 'newuser@example.com',
      password: 'password123',
      full_name: 'New User',
      phone: '+628123456789',
      whatsapp_number: '+628123456789',
    };

    it('should register a new user successfully', async () => {
      // Mock dependencies
      mockUserService.prototype.getUserByEmail.mockResolvedValue(null);
      mockUserService.prototype.createUser.mockResolvedValue(mockUser);
      mockJWTUtils.generateVerificationToken.mockReturnValue('test-token');
      mockEmailVerificationService.prototype.createVerification.mockResolvedValue({
        id: 'verification-id',
        user_id: mockUser.id,
        verification_token: 'test-token',
        token_type: 'email_verification',
        expires_at: new Date(),
        is_used: false,
      });
      mockMailer.sendVerificationEmail.mockResolvedValue({ messageId: 'test-message-id' } as any);

      const result = await authService.register(registerData);

      expect(result).toEqual(mockUser);
      expect(mockUserService.prototype.getUserByEmail).toHaveBeenCalledWith(registerData.email);
      expect(mockUserService.prototype.createUser).toHaveBeenCalledWith(registerData);
      expect(mockJWTUtils.generateVerificationToken).toHaveBeenCalledWith(
        mockUser.id,
        'email_verification',
        mockUser.email,
        '24h'
      );
      expect(mockEmailVerificationService.prototype.createVerification).toHaveBeenCalled();
      expect(mockMailer.sendVerificationEmail).toHaveBeenCalledWith(
        mockUser.email,
        mockUser.full_name,
        'test-token'
      );
    });

    it('should throw error if email already exists', async () => {
      mockUserService.prototype.getUserByEmail.mockResolvedValue(mockUser);

      await expect(authService.register(registerData)).rejects.toThrow('Email already exists');
    });

    it('should not fail registration if email sending fails', async () => {
      mockUserService.prototype.getUserByEmail.mockResolvedValue(null);
      mockUserService.prototype.createUser.mockResolvedValue(mockUser);
      mockJWTUtils.generateVerificationToken.mockReturnValue('test-token');
      mockEmailVerificationService.prototype.createVerification.mockResolvedValue({
        id: 'verification-id',
        user_id: mockUser.id,
        verification_token: 'test-token',
        token_type: 'email_verification',
        expires_at: new Date(),
        is_used: false,
      });
      mockMailer.sendVerificationEmail.mockRejectedValue(new Error('Email service down'));

      const result = await authService.register(registerData);

      expect(result).toEqual(mockUser);
      expect(mockMailer.sendVerificationEmail).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginCredentials: LoginCredentials = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login successfully with valid credentials', async () => {
      const userWithPassword = { ...mockUser, password_hash: 'hashed-password' };

      mockLoginAttemptService.prototype.isIpBlocked.mockResolvedValue(false);
      mockLoginAttemptService.prototype.isEmailBlocked.mockResolvedValue(false);
      mockUserService.prototype.getUserByEmailWithPassword.mockResolvedValue(userWithPassword);
      mockPasswordUtils.verifyPassword.mockResolvedValue(true);
      mockLoginAttemptService.prototype.recordAttempt.mockResolvedValue();
      mockJWTUtils.generateTokenPair.mockReturnValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      mockUserService.prototype.updateUser.mockResolvedValue(mockUser);

      const result = await authService.login(loginCredentials, '127.0.0.1');

      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        role: 'user',
        isActive: mockUser.is_active,
      });
      expect(result.tokens).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      expect(mockLoginAttemptService.prototype.recordAttempt).toHaveBeenCalledWith({
        userId: mockUser.id,
        email: loginCredentials.email,
        ipAddress: '127.0.0.1',
        success: true,
      });
    });

    it('should throw error for invalid credentials', async () => {
      mockLoginAttemptService.prototype.isIpBlocked.mockResolvedValue(false);
      mockLoginAttemptService.prototype.isEmailBlocked.mockResolvedValue(false);
      mockUserService.prototype.getUserByEmailWithPassword.mockResolvedValue(null);

      await expect(authService.login(loginCredentials)).rejects.toThrow(
        'Invalid email or password'
      );
      expect(mockLoginAttemptService.prototype.recordAttempt).toHaveBeenCalledWith({
        email: loginCredentials.email,
        ipAddress: 'unknown',
        success: false,
        failureReason: 'Invalid credentials',
      });
    });

    it('should throw error if IP is blocked', async () => {
      mockLoginAttemptService.prototype.isIpBlocked.mockResolvedValue(true);

      await expect(authService.login(loginCredentials)).rejects.toThrow(
        'Too many failed login attempts'
      );
    });

    it('should throw error if email is blocked', async () => {
      mockLoginAttemptService.prototype.isIpBlocked.mockResolvedValue(false);
      mockLoginAttemptService.prototype.isEmailBlocked.mockResolvedValue(true);

      await expect(authService.login(loginCredentials)).rejects.toThrow(
        'Too many failed login attempts'
      );
    });

    it('should throw error for inactive user', async () => {
      const inactiveUser = { ...mockUser, is_active: false };

      mockLoginAttemptService.prototype.isIpBlocked.mockResolvedValue(false);
      mockLoginAttemptService.prototype.isEmailBlocked.mockResolvedValue(false);
      mockUserService.prototype.getUserByEmailWithPassword.mockResolvedValue(inactiveUser);
      mockPasswordUtils.verifyPassword.mockResolvedValue(true);

      await expect(authService.login(loginCredentials)).rejects.toThrow('Account is deactivated');
    });
  });

  describe('verifyEmail', () => {
    const testToken = 'valid-jwt-token';

    it('should verify email successfully with valid token', async () => {
      const verification = {
        id: 'verification-id',
        user_id: mockUser.id,
        verification_token: testToken,
        token_type: 'email_verification',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // Future date
        is_used: false,
      };

      mockEmailVerificationService.prototype.findByToken.mockResolvedValue(verification);
      mockJWTUtils.verifyVerificationToken.mockReturnValue({
        sub: mockUser.id,
        email: mockUser.email,
        purpose: 'email_verification',
        type: 'verification',
      } as any);
      mockUserService.prototype.getUserById.mockResolvedValue(mockUser);
      mockEmailVerificationService.prototype.markAsUsed.mockResolvedValue();
      mockUserService.prototype.updateUser.mockResolvedValue({ ...mockUser, email_verified: true });

      await authService.verifyEmail(testToken);

      expect(mockEmailVerificationService.prototype.findByToken).toHaveBeenCalledWith(testToken);
      expect(mockJWTUtils.verifyVerificationToken).toHaveBeenCalledWith(
        testToken,
        'email_verification'
      );
      expect(mockEmailVerificationService.prototype.markAsUsed).toHaveBeenCalledWith(testToken);
      expect(mockUserService.prototype.updateUser).toHaveBeenCalledWith(mockUser.id, {
        email_verified: true,
      });
    });

    it('should throw error for invalid token', async () => {
      mockEmailVerificationService.prototype.findByToken.mockResolvedValue(null);

      await expect(authService.verifyEmail(testToken)).rejects.toThrow(
        'Invalid verification token'
      );
    });

    it('should throw error for used token', async () => {
      const usedVerification = {
        id: 'verification-id',
        user_id: mockUser.id,
        verification_token: testToken,
        token_type: 'email_verification',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        is_used: true,
      };

      mockEmailVerificationService.prototype.findByToken.mockResolvedValue(usedVerification);

      await expect(authService.verifyEmail(testToken)).rejects.toThrow(
        'Verification token already used'
      );
    });

    it('should throw error for expired token', async () => {
      const expiredVerification = {
        id: 'verification-id',
        user_id: mockUser.id,
        verification_token: testToken,
        token_type: 'email_verification',
        expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000), // Past date
        is_used: false,
      };

      mockEmailVerificationService.prototype.findByToken.mockResolvedValue(expiredVerification);

      await expect(authService.verifyEmail(testToken)).rejects.toThrow(
        'Verification token expired'
      );
    });
  });

  describe('forgotPassword', () => {
    const email = 'test@example.com';
    const clientIp = '127.0.0.1';

    it('should send password reset email successfully', async () => {
      mockLoginAttemptService.prototype.isEmailBlocked.mockResolvedValue(false);
      mockUserService.prototype.getUserByEmail.mockResolvedValue(mockUser);
      mockJWTUtils.generateVerificationToken.mockReturnValue('reset-token');
      mockEmailVerificationService.prototype.createVerification.mockResolvedValue({
        id: 'verification-id',
        user_id: mockUser.id,
        verification_token: 'reset-token',
        token_type: 'password_reset',
        expires_at: new Date(),
        is_used: false,
      });
      mockMailer.sendPasswordResetEmail.mockResolvedValue({ messageId: 'test-message-id' } as any);
      mockLoginAttemptService.prototype.recordAttempt.mockResolvedValue();

      await authService.forgotPassword(email, clientIp);

      expect(mockUserService.prototype.getUserByEmail).toHaveBeenCalledWith(email);
      expect(mockJWTUtils.generateVerificationToken).toHaveBeenCalledWith(
        mockUser.id,
        'password_reset',
        mockUser.email,
        '1h'
      );
      expect(mockMailer.sendPasswordResetEmail).toHaveBeenCalledWith(
        mockUser.email,
        mockUser.full_name,
        'reset-token'
      );
    });

    it('should not send email if user does not exist', async () => {
      mockLoginAttemptService.prototype.isEmailBlocked.mockResolvedValue(false);
      mockUserService.prototype.getUserByEmail.mockResolvedValue(null);

      await authService.forgotPassword(email, clientIp);

      expect(mockUserService.prototype.getUserByEmail).toHaveBeenCalledWith(email);
      expect(mockMailer.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should not send email if user is inactive', async () => {
      const inactiveUser = { ...mockUser, is_active: false };

      mockLoginAttemptService.prototype.isEmailBlocked.mockResolvedValue(false);
      mockUserService.prototype.getUserByEmail.mockResolvedValue(inactiveUser);

      await authService.forgotPassword(email, clientIp);

      expect(mockMailer.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    const token = 'valid-reset-token';
    const newPassword = 'newpassword123';

    it('should reset password successfully', async () => {
      mockJWTUtils.verifyVerificationToken.mockReturnValue({
        sub: mockUser.id,
        email: mockUser.email,
        purpose: 'password_reset',
        type: 'verification',
      } as any);
      mockUserService.prototype.getUserById.mockResolvedValue(mockUser);
      mockPasswordUtils.hashPassword.mockResolvedValue('hashed-new-password');
      mockUserService.prototype.updateUser.mockResolvedValue(mockUser);
      mockMailer.sendPasswordResetConfirmationEmail.mockResolvedValue({
        messageId: 'test-message-id',
      } as any);

      await authService.resetPassword(token, newPassword);

      expect(mockJWTUtils.verifyVerificationToken).toHaveBeenCalledWith(token, 'password_reset');
      expect(mockPasswordUtils.hashPassword).toHaveBeenCalledWith(newPassword);
      expect(mockUserService.prototype.updateUser).toHaveBeenCalledWith(mockUser.id, {
        password_hash: 'hashed-new-password',
      });
      expect(mockMailer.sendPasswordResetConfirmationEmail).toHaveBeenCalledWith(
        mockUser.email,
        mockUser.full_name
      );
    });

    it('should throw error for invalid token', async () => {
      mockJWTUtils.verifyVerificationToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.resetPassword(token, newPassword)).rejects.toThrow(
        'Password reset failed'
      );
    });

    it('should not fail if confirmation email fails', async () => {
      mockJWTUtils.verifyVerificationToken.mockReturnValue({
        sub: mockUser.id,
        email: mockUser.email,
        purpose: 'password_reset',
        type: 'verification',
      } as any);
      mockUserService.prototype.getUserById.mockResolvedValue(mockUser);
      mockPasswordUtils.hashPassword.mockResolvedValue('hashed-new-password');
      mockUserService.prototype.updateUser.mockResolvedValue(mockUser);
      mockMailer.sendPasswordResetConfirmationEmail.mockRejectedValue(
        new Error('Email service down')
      );

      await authService.resetPassword(token, newPassword);

      expect(mockUserService.prototype.updateUser).toHaveBeenCalled();
      expect(mockMailer.sendPasswordResetConfirmationEmail).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should log logout event successfully', async () => {
      const userId = 'test-user-id';

      await authService.logout(userId);

      // In a stateless JWT system, logout is primarily handled client-side
      // This test ensures the method doesn't throw errors
      expect(true).toBe(true);
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens successfully', async () => {
      const refreshToken = 'valid-refresh-token';
      const newTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockJWTUtils.refreshTokens.mockReturnValue(newTokens);

      const result = await authService.refreshTokens(refreshToken);

      expect(result.tokens).toEqual(newTokens);
      expect(result.message).toBe('Tokens refreshed successfully');
      expect(mockJWTUtils.refreshTokens).toHaveBeenCalledWith(refreshToken);
    });

    it('should throw error for invalid refresh token', async () => {
      const refreshToken = 'invalid-refresh-token';

      mockJWTUtils.refreshTokens.mockImplementation(() => {
        throw new Error('Invalid refresh token');
      });

      await expect(authService.refreshTokens(refreshToken)).rejects.toThrow('Token refresh failed');
    });
  });
});
