import { AuthService } from '../../services/AuthService';
import { UserService } from '../../services/UserService';
import { JWTUtils } from '../../utils/jwt';
import { createError } from '../../middleware/errorHandler';
import { User } from '../../types';
import { LoginCredentials, JWTUser, TokenPair } from '../../types/jwt';

// Mock dependencies
jest.mock('../../services/UserService');
jest.mock('../../utils/jwt');
jest.mock('../../middleware/errorHandler');
jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const mockUserService = UserService as jest.MockedClass<typeof UserService>;
const mockJWTUtils = JWTUtils as jest.Mocked<typeof JWTUtils>;
const mockCreateError = createError as jest.MockedFunction<typeof createError>;

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserServiceInstance: jest.Mocked<UserService>;

  const mockUser: User = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    password_hash: 'hashed_password',
    full_name: 'Test User',
    phone: '+6281234567890',
    whatsapp_number: '+6281234567890',
    subscription_plan: 'free',
    subscription_expires_at: undefined,
    is_active: true,
    last_login: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockJWTUser: JWTUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    role: 'user',
  };

  const mockTokenPair: TokenPair = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUserServiceInstance = {
      getUsers: jest.fn(),
      getUserById: jest.fn(),
      createUser: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
      getUserByEmail: jest.fn(),
      getUserByEmailWithPassword: jest.fn(),
    } as any;

    mockUserService.mockImplementation(() => mockUserServiceInstance);
    authService = new AuthService();
  });

  describe('login', () => {
    const loginCredentials: LoginCredentials = {
      email: 'test@example.com',
      password: 'password123',
      rememberMe: false,
    };

    it('should login successfully with valid credentials', async () => {
      // Mock user service to return users
      mockUserServiceInstance.getUsers.mockResolvedValue({
        data: [mockUser],
        meta: {} as any,
        success: true,
        message: 'Users retrieved',
        timestamp: new Date().toISOString(),
      });

      // Mock JWT token generation
      mockJWTUtils.generateTokenPair.mockReturnValue(mockTokenPair);

      // Mock user update for last login
      mockUserServiceInstance.updateUser.mockResolvedValue(mockUser);

      const result = await authService.login(loginCredentials);

      expect(result).toEqual({
        user: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'test@example.com',
          role: 'user',
          isActive: true,
        },
        tokens: mockTokenPair,
        message: 'Login successful',
      });
    });

    it('should throw error for invalid email', async () => {
      mockUserServiceInstance.getUsers.mockResolvedValue({
        data: [],
        meta: {} as any,
        success: true,
        message: 'Users retrieved',
        timestamp: new Date().toISOString(),
      });

      mockCreateError.mockReturnValue(new Error('Invalid email or password') as any);

      await expect(authService.login(loginCredentials)).rejects.toThrow();
      expect(mockCreateError).toHaveBeenCalledWith('Invalid email or password', 401);
    });

    it('should throw error for inactive user', async () => {
      const inactiveUser = { ...mockUser, is_active: false };

      mockUserServiceInstance.getUsers.mockResolvedValue({
        data: [inactiveUser],
        meta: {} as any,
        success: true,
        message: 'Users retrieved',
        timestamp: new Date().toISOString(),
      });

      mockCreateError.mockReturnValue(new Error('Account is deactivated') as any);

      await expect(authService.login(loginCredentials)).rejects.toThrow();
      expect(mockCreateError).toHaveBeenCalledWith('Account is deactivated', 401);
    });

    it('should handle user service errors', async () => {
      mockUserServiceInstance.getUsers.mockRejectedValue(new Error('Database error'));
      mockCreateError.mockReturnValue(new Error('Login failed') as any);

      await expect(authService.login(loginCredentials)).rejects.toThrow();
      expect(mockCreateError).toHaveBeenCalledWith('Login failed', 500);
    });

    it('should handle JWT generation errors', async () => {
      mockUserServiceInstance.getUsers.mockResolvedValue({
        data: [mockUser],
        meta: {} as any,
        success: true,
        message: 'Users retrieved',
        timestamp: new Date().toISOString(),
      });

      mockJWTUtils.generateTokenPair.mockImplementation(() => {
        throw new Error('JWT generation failed');
      });

      mockCreateError.mockReturnValue(new Error('Login failed') as any);

      await expect(authService.login(loginCredentials)).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      await expect(authService.logout('1')).resolves.toBeUndefined();
      // Logout is currently a no-op in stateless JWT system
    });

    it('should handle logout errors gracefully', async () => {
      // Even if there were errors, logout should not fail
      await expect(authService.logout('1')).resolves.toBeUndefined();
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens successfully', async () => {
      const refreshToken = 'valid-refresh-token';

      mockJWTUtils.refreshTokens.mockReturnValue(mockTokenPair);

      const result = await authService.refreshTokens(refreshToken);

      expect(result).toEqual({
        tokens: mockTokenPair,
        message: 'Tokens refreshed successfully',
      });

      expect(mockJWTUtils.refreshTokens).toHaveBeenCalledWith(refreshToken);
    });

    it('should throw error for invalid refresh token', async () => {
      const invalidToken = 'invalid-refresh-token';

      mockJWTUtils.refreshTokens.mockImplementation(() => {
        throw new Error('Invalid refresh token');
      });

      mockCreateError.mockReturnValue(new Error('Token refresh failed') as any);

      await expect(authService.refreshTokens(invalidToken)).rejects.toThrow();
      expect(mockCreateError).toHaveBeenCalledWith('Token refresh failed', 401);
    });
  });

  describe('generateVerificationToken', () => {
    const verificationRequest = {
      userId: '1',
      purpose: 'email_verification',
      email: 'test@example.com',
    };

    it('should generate verification token successfully', async () => {
      const mockToken = 'verification-token';
      const mockExpiration = new Date(Date.now() + 3600000); // 1 hour from now

      mockUserServiceInstance.getUserById.mockResolvedValue(mockUser);
      mockJWTUtils.generateVerificationToken.mockReturnValue(mockToken);
      mockJWTUtils.getTokenExpiration.mockReturnValue(mockExpiration);

      const result = await authService.generateVerificationToken(verificationRequest);

      expect(result).toEqual({
        token: mockToken,
        expiresAt: mockExpiration,
        message: 'email_verification token generated successfully',
      });

      expect(mockJWTUtils.generateVerificationToken).toHaveBeenCalledWith(
        '1',
        'email_verification',
        'test@example.com'
      );
    });

    it('should use user email when not provided in request', async () => {
      const requestWithoutEmail = {
        userId: '1',
        purpose: 'password_reset',
      };

      const mockToken = 'verification-token';
      const mockExpiration = new Date(Date.now() + 3600000);

      mockUserServiceInstance.getUserById.mockResolvedValue(mockUser);
      mockJWTUtils.generateVerificationToken.mockReturnValue(mockToken);
      mockJWTUtils.getTokenExpiration.mockReturnValue(mockExpiration);

      await authService.generateVerificationToken(requestWithoutEmail);

      expect(mockJWTUtils.generateVerificationToken).toHaveBeenCalledWith(
        '1',
        'password_reset',
        'test@example.com' // Should use user's email
      );
    });

    it('should throw error for non-existent user', async () => {
      mockUserServiceInstance.getUserById.mockResolvedValue(null);
      mockCreateError.mockReturnValue(new Error('User not found') as any);

      await expect(authService.generateVerificationToken(verificationRequest)).rejects.toThrow();
      expect(mockCreateError).toHaveBeenCalledWith('User not found', 404);
    });

    it('should throw error when token expiration cannot be determined', async () => {
      mockUserServiceInstance.getUserById.mockResolvedValue(mockUser);
      mockJWTUtils.generateVerificationToken.mockReturnValue('token');
      mockJWTUtils.getTokenExpiration.mockReturnValue(null);
      mockCreateError.mockReturnValue(new Error('Failed to determine token expiration') as any);

      await expect(authService.generateVerificationToken(verificationRequest)).rejects.toThrow();
      expect(mockCreateError).toHaveBeenCalledWith('Failed to determine token expiration', 500);
    });
  });

  describe('verifyToken', () => {
    it('should verify token successfully', async () => {
      const token = 'verification-token';
      const purpose = 'email_verification';
      const mockPayload = {
        sub: '1',
        email: 'test@example.com',
        type: 'verification' as const,
        purpose: 'email_verification',
      };

      mockJWTUtils.verifyVerificationToken.mockReturnValue(mockPayload);

      const result = await authService.verifyToken(token, purpose);

      expect(result).toEqual(mockPayload);
      expect(mockJWTUtils.verifyVerificationToken).toHaveBeenCalledWith(token, purpose);
    });

    it('should verify token without purpose', async () => {
      const token = 'verification-token';
      const mockPayload = {
        sub: '1',
        email: 'test@example.com',
        type: 'verification' as const,
        purpose: 'password_reset',
      };

      mockJWTUtils.verifyVerificationToken.mockReturnValue(mockPayload);

      const result = await authService.verifyToken(token);

      expect(result).toEqual(mockPayload);
      expect(mockJWTUtils.verifyVerificationToken).toHaveBeenCalledWith(token, undefined);
    });

    it('should throw error for invalid token', async () => {
      const token = 'invalid-token';

      mockJWTUtils.verifyVerificationToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      mockCreateError.mockReturnValue(new Error('Token verification failed') as any);

      await expect(authService.verifyToken(token)).rejects.toThrow();
      expect(mockCreateError).toHaveBeenCalledWith('Token verification failed', 401);
    });
  });

  describe('getUserFromToken', () => {
    it('should get user from valid token', async () => {
      const token = 'valid-access-token';
      const mockPayload = {
        sub: '1',
        email: 'test@example.com',
        type: 'access' as const,
      };

      mockJWTUtils.verifyToken.mockReturnValue(mockPayload);
      mockUserServiceInstance.getUserById.mockResolvedValue(mockUser);

      const result = await authService.getUserFromToken(token);

      expect(result).toEqual({
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        role: 'user',
        isActive: true,
      });

      expect(mockJWTUtils.verifyToken).toHaveBeenCalledWith(token, 'access');
      expect(mockUserServiceInstance.getUserById).toHaveBeenCalledWith(1);
    });

    it('should return null for invalid token', async () => {
      const token = 'invalid-token';

      mockJWTUtils.verifyToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await authService.getUserFromToken(token);

      expect(result).toBeNull();
    });

    it('should return null when user not found in database', async () => {
      const token = 'valid-access-token';
      const mockPayload = {
        sub: '1',
        email: 'test@example.com',
        type: 'access' as const,
      };

      mockJWTUtils.verifyToken.mockReturnValue(mockPayload);
      mockUserServiceInstance.getUserById.mockResolvedValue(null);

      const result = await authService.getUserFromToken(token);

      expect(result).toBeNull();
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const userId = '1';
      const currentPassword = 'oldpassword';
      const newPassword = 'newpassword';

      mockUserServiceInstance.getUserById.mockResolvedValue(mockUser);
      mockUserServiceInstance.updateUser.mockResolvedValue(mockUser);

      await expect(
        authService.changePassword(userId, currentPassword, newPassword)
      ).resolves.toBeUndefined();

      expect(mockUserServiceInstance.getUserById).toHaveBeenCalledWith(1);
      expect(mockUserServiceInstance.updateUser).toHaveBeenCalledWith(1, {
        password: newPassword,
      });
    });

    it('should throw error for non-existent user', async () => {
      const userId = '1';
      const currentPassword = 'oldpassword';
      const newPassword = 'newpassword';

      mockUserServiceInstance.getUserById.mockResolvedValue(null);
      mockCreateError.mockReturnValue(new Error('User not found') as any);

      await expect(
        authService.changePassword(userId, currentPassword, newPassword)
      ).rejects.toThrow();
      expect(mockCreateError).toHaveBeenCalledWith('User not found', 404);
    });

    it('should handle update errors', async () => {
      const userId = '1';
      const currentPassword = 'oldpassword';
      const newPassword = 'newpassword';

      mockUserServiceInstance.getUserById.mockResolvedValue(mockUser);
      mockUserServiceInstance.updateUser.mockRejectedValue(new Error('Update failed'));
      mockCreateError.mockReturnValue(new Error('Password change failed') as any);

      await expect(
        authService.changePassword(userId, currentPassword, newPassword)
      ).rejects.toThrow();
      expect(mockCreateError).toHaveBeenCalledWith('Password change failed', 500);
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const token = 'valid-reset-token';
      const newPassword = 'newpassword';
      const mockPayload = {
        sub: '1',
        type: 'verification' as const,
        purpose: 'password_reset',
      };

      // Mock the verifyToken method to return the payload
      jest.spyOn(authService, 'verifyToken').mockResolvedValue(mockPayload);
      mockUserServiceInstance.updateUser.mockResolvedValue(mockUser);

      await expect(authService.resetPassword(token, newPassword)).resolves.toBeUndefined();

      expect(authService.verifyToken).toHaveBeenCalledWith(token, 'password_reset');
      expect(mockUserServiceInstance.updateUser).toHaveBeenCalledWith(1, {
        password: newPassword,
      });
    });

    it('should throw error for invalid reset token', async () => {
      const token = 'invalid-reset-token';
      const newPassword = 'newpassword';

      jest.spyOn(authService, 'verifyToken').mockRejectedValue(new Error('Invalid token'));
      mockCreateError.mockReturnValue(new Error('Password reset failed') as any);

      await expect(authService.resetPassword(token, newPassword)).rejects.toThrow();
    });
  });

  describe('validateTokenAndGetUser', () => {
    it('should validate token and return user', async () => {
      const token = 'valid-token';
      const expectedUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        role: 'user',
        isActive: true,
      };

      jest.spyOn(authService, 'getUserFromToken').mockResolvedValue(expectedUser);

      const result = await authService.validateTokenAndGetUser(token);

      expect(result).toEqual(expectedUser);
      expect(authService.getUserFromToken).toHaveBeenCalledWith(token);
    });

    it('should return null for invalid token', async () => {
      const token = 'invalid-token';

      jest.spyOn(authService, 'getUserFromToken').mockResolvedValue(null);

      const result = await authService.validateTokenAndGetUser(token);

      expect(result).toBeNull();
    });
  });

  describe('userHasRole', () => {
    it('should return true for user role', async () => {
      const userId = '1';
      const role = 'user';

      mockUserServiceInstance.getUserById.mockResolvedValue(mockUser);

      const result = await authService.userHasRole(userId, role);

      expect(result).toBe(true);
      expect(mockUserServiceInstance.getUserById).toHaveBeenCalledWith(1);
    });

    it('should return false for non-user role', async () => {
      const userId = '1';
      const role = 'admin';

      mockUserServiceInstance.getUserById.mockResolvedValue(mockUser);

      const result = await authService.userHasRole(userId, role);

      expect(result).toBe(false);
    });

    it('should return false when user not found', async () => {
      const userId = '1';
      const role = 'user';

      mockUserServiceInstance.getUserById.mockResolvedValue(null);

      const result = await authService.userHasRole(userId, role);

      expect(result).toBe(false);
    });

    it('should return false on database error', async () => {
      const userId = '1';
      const role = 'user';

      mockUserServiceInstance.getUserById.mockRejectedValue(new Error('Database error'));

      const result = await authService.userHasRole(userId, role);

      expect(result).toBe(false);
    });
  });
});
