import request from 'supertest';
import { app } from '../../index';
import { AuthService } from '../../services/AuthService';
import { UserService } from '../../services/UserService';
import { JWTUtils } from '../../utils/jwt';
import { PasswordUtils } from '../../utils/password';
import { mailer } from '../../mails';

// Mock services
jest.mock('../../services/AuthService');
jest.mock('../../services/UserService');
jest.mock('../../utils/jwt');
jest.mock('../../utils/password');
jest.mock('../../mails');

const mockAuthService = AuthService as jest.MockedClass<typeof AuthService>;
const mockUserService = UserService as jest.MockedClass<typeof UserService>;
const mockJWTUtils = JWTUtils as jest.Mocked<typeof JWTUtils>;
const mockPasswordUtils = PasswordUtils as jest.Mocked<typeof PasswordUtils>;
const mockMailer = mailer as jest.Mocked<typeof mailer>;

describe('Auth Endpoints Integration Tests', () => {
  const baseUrl = '/api/v1/auth';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /register', () => {
    const validRegistrationData = {
      email: 'newuser@example.com',
      password: 'Password123!',
      full_name: 'New User',
      phone: '+628123456789',
      whatsapp_number: '+628123456789',
    };

    it('should register user successfully', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: validRegistrationData.email,
        full_name: validRegistrationData.full_name,
        phone: validRegistrationData.phone,
        whatsapp_number: validRegistrationData.whatsapp_number,
        subscription_plan: 'free',
        is_active: true,
        email_verified: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockUserService.prototype.getUserByEmail.mockResolvedValue(null);
      mockUserService.prototype.createUser.mockResolvedValue(mockUser);
      mockJWTUtils.generateVerificationToken.mockReturnValue('test-token');
      mockMailer.sendVerificationEmail.mockResolvedValue({ messageId: 'test-message-id' } as any);

      const response = await request(app)
        .post(`${baseUrl}/register`)
        .send(validRegistrationData)
        .expect(201);

      expect(response.body).toMatchObject({
        message: 'User registered successfully',
        data: {
          id: mockUser.id,
          email: mockUser.email,
          full_name: mockUser.full_name,
          phone: mockUser.phone,
          whatsapp_number: mockUser.whatsapp_number,
          subscription_plan: mockUser.subscription_plan,
          is_active: mockUser.is_active,
          email_verified: mockUser.email_verified,
        },
      });

      expect(mockUserService.prototype.getUserByEmail).toHaveBeenCalledWith(validRegistrationData.email);
      expect(mockUserService.prototype.createUser).toHaveBeenCalledWith(validRegistrationData);
      expect(mockMailer.sendVerificationEmail).toHaveBeenCalledWith(
        mockUser.email,
        mockUser.full_name,
        'test-token'
      );
    });

    it('should return 409 for existing email', async () => {
      const existingUser = {
        id: 'existing-user-id',
        email: validRegistrationData.email,
        full_name: 'Existing User',
      };

      mockUserService.prototype.getUserByEmail.mockResolvedValue(existingUser);

      const response = await request(app)
        .post(`${baseUrl}/register`)
        .send(validRegistrationData)
        .expect(409);

      expect(response.body).toMatchObject({
        error: 'Email already exists',
        errorCode: 'EMAIL_ALREADY_EXISTS',
      });
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123', // Too short
        full_name: '', // Empty
      };

      const response = await request(app)
        .post(`${baseUrl}/register`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('should login successfully with valid credentials', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: validLoginData.email,
        full_name: 'Test User',
        is_active: true,
        email_verified: true,
      };

      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      mockUserService.prototype.getUserByEmailWithPassword.mockResolvedValue({
        ...mockUser,
        password_hash: 'hashed-password',
      });
      mockPasswordUtils.verifyPassword.mockResolvedValue(true);
      mockJWTUtils.generateTokenPair.mockReturnValue(mockTokens);

      const response = await request(app)
        .post(`${baseUrl}/login`)
        .send(validLoginData)
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Login successful',
        data: {
          user: {
            id: mockUser.id,
            email: mockUser.email,
            role: 'user',
            isActive: mockUser.is_active,
          },
          tokens: mockTokens,
        },
      });
    });

    it('should return 401 for invalid credentials', async () => {
      mockUserService.prototype.getUserByEmailWithPassword.mockResolvedValue(null);

      const response = await request(app)
        .post(`${baseUrl}/login`)
        .send(validLoginData)
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Invalid email or password',
      });
    });

    it('should return 401 for inactive user', async () => {
      const inactiveUser = {
        id: 'test-user-id',
        email: validLoginData.email,
        is_active: false,
      };

      mockUserService.prototype.getUserByEmailWithPassword.mockResolvedValue({
        ...inactiveUser,
        password_hash: 'hashed-password',
      });
      mockPasswordUtils.verifyPassword.mockResolvedValue(true);

      const response = await request(app)
        .post(`${baseUrl}/login`)
        .send(validLoginData)
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Account is deactivated',
      });
    });
  });

  describe('POST /verify-email', () => {
    const validToken = 'valid-verification-token';

    it('should verify email successfully', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        email_verified: false,
      };

      mockJWTUtils.verifyVerificationToken.mockReturnValue({
        sub: mockUser.id,
        email: mockUser.email,
        purpose: 'email_verification',
        type: 'verification',
      } as any);
      mockUserService.prototype.getUserById.mockResolvedValue(mockUser);
      mockUserService.prototype.updateUser.mockResolvedValue({
        ...mockUser,
        email_verified: true,
      });

      const response = await request(app)
        .post(`${baseUrl}/verify-email`)
        .send({ token: validToken })
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Email verified successfully. You can now login to your account.',
        data: null,
      });
    });

    it('should return 401 for invalid token', async () => {
      mockJWTUtils.verifyVerificationToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .post(`${baseUrl}/verify-email`)
        .send({ token: 'invalid-token' })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for missing token', async () => {
      const response = await request(app)
        .post(`${baseUrl}/verify-email`)
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Verification token is required',
      });
    });
  });

  describe('POST /forgot-password', () => {
    const validEmail = 'test@example.com';

    it('should send password reset email successfully', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: validEmail,
        full_name: 'Test User',
        is_active: true,
      };

      mockUserService.prototype.getUserByEmail.mockResolvedValue(mockUser);
      mockJWTUtils.generateVerificationToken.mockReturnValue('reset-token');
      mockMailer.sendPasswordResetEmail.mockResolvedValue({ messageId: 'test-message-id' } as any);

      const response = await request(app)
        .post(`${baseUrl}/forgot-password`)
        .send({ email: validEmail })
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Password reset email sent successfully',
      });

      expect(mockMailer.sendPasswordResetEmail).toHaveBeenCalledWith(
        mockUser.email,
        mockUser.full_name,
        'reset-token'
      );
    });

    it('should not reveal if email exists or not', async () => {
      mockUserService.prototype.getUserByEmail.mockResolvedValue(null);

      const response = await request(app)
        .post(`${baseUrl}/forgot-password`)
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Password reset email sent successfully',
      });
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post(`${baseUrl}/forgot-password`)
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /reset-password', () => {
    const validToken = 'valid-reset-token';
    const newPassword = 'NewPassword123!';

    it('should reset password successfully', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        full_name: 'Test User',
      };

      mockJWTUtils.verifyVerificationToken.mockReturnValue({
        sub: mockUser.id,
        email: mockUser.email,
        purpose: 'password_reset',
        type: 'verification',
      } as any);
      mockUserService.prototype.getUserById.mockResolvedValue(mockUser);
      mockPasswordUtils.hashPassword.mockResolvedValue('hashed-new-password');
      mockUserService.prototype.updateUser.mockResolvedValue(mockUser);
      mockMailer.sendPasswordResetConfirmationEmail.mockResolvedValue({ messageId: 'test-message-id' } as any);

      const response = await request(app)
        .post(`${baseUrl}/reset-password`)
        .send({ token: validToken, newPassword })
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Password reset successfully',
      });

      expect(mockPasswordUtils.hashPassword).toHaveBeenCalledWith(newPassword);
      expect(mockUserService.prototype.updateUser).toHaveBeenCalledWith(mockUser.id, {
        password_hash: 'hashed-new-password',
      });
      expect(mockMailer.sendPasswordResetConfirmationEmail).toHaveBeenCalledWith(
        mockUser.email,
        mockUser.full_name
      );
    });

    it('should return 401 for invalid token', async () => {
      mockJWTUtils.verifyVerificationToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .post(`${baseUrl}/reset-password`)
        .send({ token: 'invalid-token', newPassword })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for weak password', async () => {
      const weakPassword = '123';

      const response = await request(app)
        .post(`${baseUrl}/reset-password`)
        .send({ token: validToken, newPassword: weakPassword })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /refresh', () => {
    const validRefreshToken = 'valid-refresh-token';

    it('should refresh tokens successfully', async () => {
      const newTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockJWTUtils.refreshTokens.mockReturnValue(newTokens);

      const response = await request(app)
        .post(`${baseUrl}/refresh`)
        .send({ refreshToken: validRefreshToken })
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Tokens refreshed successfully',
        data: {
          tokens: newTokens,
        },
      });

      expect(mockJWTUtils.refreshTokens).toHaveBeenCalledWith(validRefreshToken);
    });

    it('should return 401 for invalid refresh token', async () => {
      mockJWTUtils.refreshTokens.mockImplementation(() => {
        throw new Error('Invalid refresh token');
      });

      const response = await request(app)
        .post(`${baseUrl}/refresh`)
        .send({ refreshToken: 'invalid-refresh-token' })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post(`${baseUrl}/logout`)
        .set('Authorization', 'Bearer valid-access-token')
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Logged out successfully',
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should limit login attempts', async () => {
      // Mock rate limiting to block after multiple attempts
      mockUserService.prototype.getUserByEmailWithPassword.mockResolvedValue(null);

      // Make multiple failed login attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post(`${baseUrl}/login`)
          .send({ email: 'test@example.com', password: 'wrong-password' })
          .expect(401);
      }

      // Next attempt should be blocked
      const response = await request(app)
        .post(`${baseUrl}/login`)
        .send({ email: 'test@example.com', password: 'wrong-password' })
        .expect(429);

      expect(response.body).toMatchObject({
        error: 'Too many failed login attempts',
      });
    });
  });

  describe('Input Validation', () => {
    it('should validate email format', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'Password123!',
        full_name: 'Test User',
      };

      const response = await request(app)
        .post(`${baseUrl}/register`)
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toContain('email');
    });

    it('should validate password strength', async () => {
      const weakPasswordData = {
        email: 'test@example.com',
        password: '123',
        full_name: 'Test User',
      };

      const response = await request(app)
        .post(`${baseUrl}/register`)
        .send(weakPasswordData)
        .expect(400);

      expect(response.body.error).toContain('password');
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        email: 'test@example.com',
        // Missing password and full_name
      };

      const response = await request(app)
        .post(`${baseUrl}/register`)
        .send(incompleteData)
        .expect(400);

      expect(response.body.error).toContain('required');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get(`${baseUrl}/health`)
        .expect(200);

      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });
  });
}); 