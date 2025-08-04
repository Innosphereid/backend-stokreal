import request from 'supertest';
import app from '../../index';
import { JWTUtils } from '../../utils/jwt';
import { AuthService } from '../../services/AuthService';
import { UserService } from '../../services/UserService';

// Mock external dependencies
jest.mock('@/config/database', () => ({
  connectDatabase: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/services/UserService');
jest.mock('@/services/AuthService');

const mockUserService = UserService as jest.MockedClass<typeof UserService>;
const mockAuthService = AuthService as jest.MockedClass<typeof AuthService>;

describe('JWT Authentication Integration Tests', () => {
  let mockUserServiceInstance: jest.Mocked<UserService>;
  let mockAuthServiceInstance: jest.Mocked<AuthService>;

  // Mock user data for testing
  // const mockUser = {
  //   id: 1,
  //   email: 'test@example.com',
  //   username: 'testuser',
  //   first_name: 'Test',
  //   last_name: 'User',
  //   is_active: true,
  //   last_login: new Date(),
  //   created_at: new Date(),
  //   updated_at: new Date(),
  // };

  const mockTokenPair = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  };

  const mockAuthenticatedUser = {
    id: '1',
    email: 'test@example.com',
    role: 'user',
    isActive: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock UserService instance
    mockUserServiceInstance = {
      getAllUsers: jest.fn(),
      getUserById: jest.fn(),
      createUser: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
    } as any;

    // Mock AuthService instance
    mockAuthServiceInstance = {
      login: jest.fn(),
      logout: jest.fn(),
      refreshTokens: jest.fn(),
      generateVerificationToken: jest.fn(),
      verifyToken: jest.fn(),
      getUserFromToken: jest.fn(),
      changePassword: jest.fn(),
      resetPassword: jest.fn(),
      validateTokenAndGetUser: jest.fn(),
      userHasRole: jest.fn(),
    } as any;

    mockUserService.mockImplementation(() => mockUserServiceInstance);
    mockAuthService.mockImplementation(() => mockAuthServiceInstance);
  });

  describe('Authentication Flow', () => {
    describe('POST /api/v1/auth/login', () => {
      it('should login successfully with valid credentials', async () => {
        const loginCredentials = {
          email: 'test@example.com',
          password: 'password123',
        };

        const loginResponse = {
          user: mockAuthenticatedUser,
          tokens: mockTokenPair,
          message: 'Login successful',
        };

        mockAuthServiceInstance.login.mockResolvedValue(loginResponse);

        const response = await request(app)
          .post('/api/v1/auth/login')
          .send(loginCredentials)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Login successful',
          data: {
            user: mockAuthenticatedUser,
            tokens: mockTokenPair,
          },
        });

        // Check if JWT cookies are set
        expect(response.headers['set-cookie']).toBeDefined();
        const cookies = response.headers['set-cookie'] as unknown as string[];
        expect(cookies.some((cookie: string) => cookie.includes('jwt_access'))).toBe(true);
        expect(cookies.some((cookie: string) => cookie.includes('jwt_refresh'))).toBe(true);
      });

      it('should return 401 for invalid credentials', async () => {
        const loginCredentials = {
          email: 'test@example.com',
          password: 'wrongpassword',
        };

        const error = new Error('Invalid email or password');
        (error as any).statusCode = 401;
        mockAuthServiceInstance.login.mockRejectedValue(error);

        const response = await request(app)
          .post('/api/v1/auth/login')
          .send(loginCredentials)
          .expect(401);

        expect(response.body).toMatchObject({
          success: false,
          message: 'Invalid email or password',
        });
      });

      it('should return 400 for missing credentials', async () => {
        const response = await request(app).post('/api/v1/auth/login').send({}).expect(400);

        expect(response.body).toMatchObject({
          success: false,
          message: expect.stringContaining('required'),
        });
      });
    });

    describe('POST /api/v1/auth/refresh', () => {
      it('should refresh tokens successfully', async () => {
        const refreshResponse = {
          tokens: {
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
          },
          message: 'Tokens refreshed successfully',
        };

        mockAuthServiceInstance.refreshTokens.mockResolvedValue(refreshResponse);

        // Create a valid refresh token for testing
        const refreshToken = JWTUtils.signToken({ sub: '1' }, 'refresh');

        const response = await request(app)
          .post('/api/v1/auth/refresh')
          .set('Cookie', [`jwt_refresh=${refreshToken}`])
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Tokens refreshed successfully',
          data: {
            tokens: refreshResponse.tokens,
          },
        });

        // Check if new JWT cookies are set
        expect(response.headers['set-cookie']).toBeDefined();
        const cookies = response.headers['set-cookie'] as unknown as string[];
        expect(cookies.some((cookie: string) => cookie.includes('jwt_access'))).toBe(true);
        expect(cookies.some((cookie: string) => cookie.includes('jwt_refresh'))).toBe(true);
      });

      it('should return 401 for missing refresh token', async () => {
        const response = await request(app).post('/api/v1/auth/refresh').expect(401);

        expect(response.body).toMatchObject({
          success: false,
          message: expect.stringContaining('token not found'),
        });
      });

      it('should return 401 for invalid refresh token', async () => {
        const error = new Error('Invalid refresh token');
        (error as any).statusCode = 401;
        mockAuthServiceInstance.refreshTokens.mockRejectedValue(error);

        const response = await request(app)
          .post('/api/v1/auth/refresh')
          .set('Cookie', ['jwt_refresh=invalid-token'])
          .expect(401);

        expect(response.body).toMatchObject({
          success: false,
          message: 'Invalid refresh token',
        });
      });
    });

    describe('POST /api/v1/auth/logout', () => {
      it('should logout successfully', async () => {
        mockAuthServiceInstance.logout.mockResolvedValue();

        // Create a valid access token for testing
        const accessToken = JWTUtils.signToken(
          { sub: '1', email: 'test@example.com', role: 'user' },
          'access'
        );

        const response = await request(app)
          .post('/api/v1/auth/logout')
          .set('Cookie', [`jwt_access=${accessToken}`])
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Logout successful',
        });

        // Check if JWT cookies are cleared
        expect(response.headers['set-cookie']).toBeDefined();
        const cookies = response.headers['set-cookie'] as unknown as string[];
        expect(
          cookies.some(
            (cookie: string) => cookie.includes('jwt_access') && cookie.includes('Max-Age=0')
          )
        ).toBe(true);
        expect(
          cookies.some(
            (cookie: string) => cookie.includes('jwt_refresh') && cookie.includes('Max-Age=0')
          )
        ).toBe(true);
      });

      it('should return 401 for missing access token', async () => {
        const response = await request(app).post('/api/v1/auth/logout').expect(401);

        expect(response.body).toMatchObject({
          success: false,
          message: expect.stringContaining('token not found'),
        });
      });
    });
  });

  describe('Protected Routes', () => {
    describe('GET /api/v1/auth/profile', () => {
      it('should return user profile with valid token', async () => {
        mockAuthServiceInstance.getUserFromToken.mockResolvedValue(mockAuthenticatedUser);

        // Create a valid access token for testing
        const accessToken = JWTUtils.signToken(
          { sub: '1', email: 'test@example.com', role: 'user' },
          'access'
        );

        const response = await request(app)
          .get('/api/v1/auth/profile')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            user: mockAuthenticatedUser,
          },
        });
      });

      it('should return 401 for missing token', async () => {
        const response = await request(app).get('/api/v1/auth/profile').expect(401);

        expect(response.body).toMatchObject({
          success: false,
          message: expect.stringContaining('token not found'),
        });
      });

      it('should return 401 for invalid token', async () => {
        const response = await request(app)
          .get('/api/v1/auth/profile')
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);

        expect(response.body).toMatchObject({
          success: false,
          message: expect.stringContaining('Invalid token'),
        });
      });

      it('should work with token from cookies', async () => {
        mockAuthServiceInstance.getUserFromToken.mockResolvedValue(mockAuthenticatedUser);

        // Create a valid access token for testing
        const accessToken = JWTUtils.signToken(
          { sub: '1', email: 'test@example.com', role: 'user' },
          'access'
        );

        const response = await request(app)
          .get('/api/v1/auth/profile')
          .set('Cookie', [`jwt_access=${accessToken}`])
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            user: mockAuthenticatedUser,
          },
        });
      });
    });
  });

  describe('Token Verification', () => {
    describe('POST /api/v1/auth/verify-email', () => {
      it('should verify email with valid verification token', async () => {
        const mockPayload = {
          sub: '1',
          email: 'test@example.com',
          type: 'verification' as const,
          purpose: 'email_verification',
        };

        mockAuthServiceInstance.verifyToken.mockResolvedValue(mockPayload);

        // Create a valid verification token for testing
        const verificationToken = JWTUtils.generateVerificationToken(
          '1',
          'email_verification',
          'test@example.com'
        );

        const response = await request(app)
          .post('/api/v1/auth/verify-email')
          .send({ token: verificationToken })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Email verified successfully',
        });

        expect(mockAuthServiceInstance.verifyToken).toHaveBeenCalledWith(
          verificationToken,
          'email_verification'
        );
      });

      it('should return 400 for missing token', async () => {
        const response = await request(app).post('/api/v1/auth/verify-email').send({}).expect(400);

        expect(response.body).toMatchObject({
          success: false,
          message: expect.stringContaining('token is required'),
        });
      });

      it('should return 401 for invalid verification token', async () => {
        const error = new Error('Invalid verification token');
        (error as any).statusCode = 401;
        mockAuthServiceInstance.verifyToken.mockRejectedValue(error);

        const response = await request(app)
          .post('/api/v1/auth/verify-email')
          .send({ token: 'invalid-token' })
          .expect(401);

        expect(response.body).toMatchObject({
          success: false,
          message: 'Invalid verification token',
        });
      });
    });

    describe('POST /api/v1/auth/reset-password', () => {
      it('should reset password with valid reset token', async () => {
        mockAuthServiceInstance.resetPassword.mockResolvedValue();

        // Create a valid password reset token for testing
        const resetToken = JWTUtils.generateVerificationToken(
          '1',
          'password_reset',
          'test@example.com'
        );

        const response = await request(app)
          .post('/api/v1/auth/reset-password')
          .send({
            token: resetToken,
            newPassword: 'newpassword123',
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Password reset successfully',
        });

        expect(mockAuthServiceInstance.resetPassword).toHaveBeenCalledWith(
          resetToken,
          'newpassword123'
        );
      });

      it('should return 400 for missing required fields', async () => {
        const response = await request(app)
          .post('/api/v1/auth/reset-password')
          .send({ token: 'some-token' }) // missing newPassword
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          message: expect.stringContaining('required'),
        });
      });

      it('should return 401 for invalid reset token', async () => {
        const error = new Error('Invalid reset token');
        (error as any).statusCode = 401;
        mockAuthServiceInstance.resetPassword.mockRejectedValue(error);

        const response = await request(app)
          .post('/api/v1/auth/reset-password')
          .send({
            token: 'invalid-token',
            newPassword: 'newpassword123',
          })
          .expect(401);

        expect(response.body).toMatchObject({
          success: false,
          message: 'Invalid reset token',
        });
      });
    });
  });

  describe('Password Management', () => {
    describe('POST /api/v1/auth/change-password', () => {
      it('should change password with valid credentials', async () => {
        mockAuthServiceInstance.changePassword.mockResolvedValue();

        // Create a valid access token for testing
        const accessToken = JWTUtils.signToken(
          { sub: '1', email: 'test@example.com', role: 'user' },
          'access'
        );

        const response = await request(app)
          .post('/api/v1/auth/change-password')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            currentPassword: 'oldpassword',
            newPassword: 'newpassword123',
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Password changed successfully',
        });

        expect(mockAuthServiceInstance.changePassword).toHaveBeenCalledWith(
          '1',
          'oldpassword',
          'newpassword123'
        );
      });

      it('should return 401 for missing authentication', async () => {
        const response = await request(app)
          .post('/api/v1/auth/change-password')
          .send({
            currentPassword: 'oldpassword',
            newPassword: 'newpassword123',
          })
          .expect(401);

        expect(response.body).toMatchObject({
          success: false,
          message: expect.stringContaining('token not found'),
        });
      });

      it('should return 400 for missing required fields', async () => {
        // Create a valid access token for testing
        const accessToken = JWTUtils.signToken(
          { sub: '1', email: 'test@example.com', role: 'user' },
          'access'
        );

        const response = await request(app)
          .post('/api/v1/auth/change-password')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ currentPassword: 'oldpassword' }) // missing newPassword
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          message: expect.stringContaining('required'),
        });
      });
    });
  });

  describe('Token Expiration and Refresh Flow', () => {
    it('should handle token expiration and refresh cycle', async () => {
      // Step 1: Login
      const loginResponse = {
        user: mockAuthenticatedUser,
        tokens: mockTokenPair,
        message: 'Login successful',
      };

      mockAuthServiceInstance.login.mockResolvedValue(loginResponse);

      const loginResult = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(loginResult.body.data.tokens).toBeDefined();

      // Step 2: Use access token for protected route
      mockAuthServiceInstance.getUserFromToken.mockResolvedValue(mockAuthenticatedUser);

      const profileResult = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${mockTokenPair.accessToken}`)
        .expect(200);

      expect(profileResult.body.data.user).toEqual(mockAuthenticatedUser);

      // Step 3: Refresh tokens
      const refreshResponse = {
        tokens: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        },
        message: 'Tokens refreshed successfully',
      };

      mockAuthServiceInstance.refreshTokens.mockResolvedValue(refreshResponse);

      const refreshResult = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`jwt_refresh=${mockTokenPair.refreshToken}`])
        .expect(200);

      expect(refreshResult.body.data.tokens).toEqual(refreshResponse.tokens);

      // Step 4: Logout
      mockAuthServiceInstance.logout.mockResolvedValue();

      const logoutResult = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${refreshResponse.tokens.accessToken}`)
        .expect(200);

      expect(logoutResult.body.message).toBe('Logout successful');
    });
  });
});
