import request from 'supertest';
import express from 'express';
import { AuthController } from '../../controllers/AuthController';
import { AuthService } from '../../services/AuthService';
import { UserService } from '../../services/UserService';
import { User } from '../../types';
import { errorHandler } from '../../middleware/errorHandler';

// Mock the AuthService
jest.mock('../../services/AuthService');
const MockedAuthService = AuthService as jest.MockedClass<typeof AuthService>;

// Mock the UserService
jest.mock('../../services/UserService');
const MockedUserService = UserService as jest.MockedClass<typeof UserService>;

describe('AuthController', () => {
  let app: express.Application;
  let authController: AuthController;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockUserService: jest.Mocked<UserService>;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Create mock services
    mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      getUserFromToken: jest.fn(),
    } as any;

    mockUserService = {
      getUserById: jest.fn(),
    } as any;

    // Mock the AuthService constructor
    MockedAuthService.mockImplementation(() => mockAuthService);

    // Mock the UserService constructor
    MockedUserService.mockImplementation(() => mockUserService);

    // Create controller instance
    authController = new AuthController();

    // Add the routes
    app.post('/register', authController.register);
    app.post('/login', authController.login);

    // Add error handler middleware
    app.use(errorHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /register', () => {
    const validUserData = {
      email: 'test@example.com',
      full_name: 'Test User',
      password: 'Password123',
      confirm_password: 'Password123',
    };

    const mockUser: User = {
      id: '1',
      email: 'test@example.com',
      password_hash: 'hashed_password',
      full_name: 'Test User',
      subscription_plan: 'free',
      is_active: true,
      email_verified: false,
      created_at: new Date(),
      updated_at: new Date(),
    };

    it('should register a user successfully with valid data', async () => {
      // Mock the service response
      mockAuthService.register.mockResolvedValue(mockUser);

      const response = await request(app).post('/register').send(validUserData).expect(201);

      expect(response.body).toEqual({
        message: 'User registered successfully. Please check your email for verification.',
        data: {
          user: {
            id: '1',
            email: 'test@example.com',
            full_name: 'Test User',
            subscription_plan: 'free',
            is_active: true,
            created_at: expect.any(String),
            email_verified: false,
          },
        },
        timestamp: expect.any(String),
      });

      expect(mockAuthService.register).toHaveBeenCalledWith({
        email: 'test@example.com',
        full_name: 'Test User',
        password: 'Password123',
        confirm_password: 'Password123',
        phone: undefined,
        whatsapp_number: undefined,
      });
    });

    it('should return validation error for missing email', async () => {
      const invalidData = {
        full_name: validUserData.full_name,
        password: validUserData.password,
        confirm_password: validUserData.confirm_password,
      };

      const response = await request(app).post('/register').send(invalidData).expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'email', message: 'Email is required' }],
        timestamp: expect.any(String),
      });

      expect(mockAuthService.register).not.toHaveBeenCalled();
    });

    it('should return validation error for invalid email format', async () => {
      const invalidData = { ...validUserData, email: 'invalid-email' };

      const response = await request(app).post('/register').send(invalidData).expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'email', message: 'Invalid email format' }],
        timestamp: expect.any(String),
      });

      expect(mockAuthService.register).not.toHaveBeenCalled();
    });

    it('should return validation error for weak password', async () => {
      const invalidData = { ...validUserData, password: 'weak', confirm_password: 'weak' };

      const response = await request(app).post('/register').send(invalidData).expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'password', message: 'Password must be at least 8 characters long' },
          {
            field: 'password',
            message:
              'Password must contain at least one uppercase letter, one lowercase letter, and one number',
          },
        ],
        timestamp: expect.any(String),
      });

      expect(mockAuthService.register).not.toHaveBeenCalled();
    });

    it('should return validation error for mismatched passwords', async () => {
      const invalidData = { ...validUserData, confirm_password: 'DifferentPassword123' };

      const response = await request(app).post('/register').send(invalidData).expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'confirm_password', message: 'Passwords do not match' }],
        timestamp: expect.any(String),
      });

      expect(mockAuthService.register).not.toHaveBeenCalled();
    });

    it('should return validation error for invalid full_name format', async () => {
      const invalidData = { ...validUserData, full_name: '' };

      const response = await request(app).post('/register').send(invalidData).expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [
          {
            field: 'full_name',
            message: 'Full name is required',
          },
        ],
        timestamp: expect.any(String),
      });

      expect(mockAuthService.register).not.toHaveBeenCalled();
    });

    it('should handle service errors gracefully', async () => {
      // Mock service to throw an error
      mockAuthService.register.mockRejectedValue(new Error('Email already exists'));

      const response = await request(app).post('/register').send(validUserData).expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'Something went wrong',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
        },
        timestamp: expect.any(String),
      });
    });

    it('should sanitize input data (trim and lowercase)', async () => {
      const unsanitizedData = {
        email: '  TEST@EXAMPLE.COM  ',
        full_name: '  Test User  ',
        password: 'Password123',
        confirm_password: 'Password123',
      };

      mockAuthService.register.mockResolvedValue(mockUser);

      await request(app).post('/register').send(unsanitizedData).expect(201);

      expect(mockAuthService.register).toHaveBeenCalledWith({
        email: 'test@example.com',
        full_name: 'Test User',
        password: 'Password123',
        confirm_password: 'Password123',
        phone: undefined,
        whatsapp_number: undefined,
      });
    });
  });

  describe('POST /login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'Password123',
    };

    const mockUser: User = {
      id: '1',
      email: 'test@example.com',
      password_hash: 'hashed_password',
      full_name: 'Test User',
      subscription_plan: 'free',
      is_active: true,
      email_verified: false,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const mockLoginResponse = {
      user: {
        id: '1',
        email: 'test@example.com',
        role: 'user',
        isActive: true,
      },
      tokens: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      },
      message: 'Login successful',
    };

    it('should login a user successfully with valid credentials', async () => {
      // Mock the service responses
      mockAuthService.login.mockResolvedValue(mockLoginResponse);
      mockAuthService.getUserFromToken.mockResolvedValue(mockLoginResponse.user);
      mockUserService.getUserById.mockResolvedValue(mockUser);

      const response = await request(app).post('/login').send(validLoginData).expect(200);

      expect(response.body).toEqual({
        message: 'Login successful',
        data: {
          user: {
            id: '1',
            email: 'test@example.com',
            full_name: 'Test User',
            subscription_plan: 'free',
          },
          tokens: {
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            expires_in: 86400,
          },
        },
        timestamp: expect.any(String),
      });

      expect(mockAuthService.login).toHaveBeenCalledWith(
        {
          email: 'test@example.com',
          password: 'Password123',
          rememberMe: false,
        },
        expect.any(String)
      );
    });

    it('should login with remember_me option', async () => {
      const loginDataWithRemember = {
        ...validLoginData,
        remember_me: true,
      };

      mockAuthService.login.mockResolvedValue(mockLoginResponse);
      mockAuthService.getUserFromToken.mockResolvedValue(mockLoginResponse.user);
      mockUserService.getUserById.mockResolvedValue(mockUser);

      await request(app).post('/login').send(loginDataWithRemember).expect(200);

      expect(mockAuthService.login).toHaveBeenCalledWith(
        {
          email: 'test@example.com',
          password: 'Password123',
          rememberMe: true,
        },
        expect.any(String)
      );
    });

    it('should return validation error for missing email', async () => {
      const invalidData = {
        password: validLoginData.password,
      };

      const response = await request(app).post('/login').send(invalidData).expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'email', message: 'Email is required' }],
        timestamp: expect.any(String),
      });

      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should return validation error for missing password', async () => {
      const invalidData = {
        email: validLoginData.email,
      };

      const response = await request(app).post('/login').send(invalidData).expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'password', message: 'Password is required' }],
        timestamp: expect.any(String),
      });

      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should return validation error for invalid email format', async () => {
      const invalidData = { ...validLoginData, email: 'invalid-email' };

      const response = await request(app).post('/login').send(invalidData).expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'email', message: 'Invalid email format' }],
        timestamp: expect.any(String),
      });

      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should sanitize input data (trim and lowercase email)', async () => {
      const unsanitizedData = {
        email: '  TEST@EXAMPLE.COM  ',
        password: 'Password123',
      };

      mockAuthService.login.mockResolvedValue(mockLoginResponse);
      mockAuthService.getUserFromToken.mockResolvedValue(mockLoginResponse.user);
      mockUserService.getUserById.mockResolvedValue(mockUser);

      await request(app).post('/login').send(unsanitizedData).expect(200);

      expect(mockAuthService.login).toHaveBeenCalledWith(
        {
          email: 'test@example.com',
          password: 'Password123',
          rememberMe: false,
        },
        expect.any(String)
      );
    });

    it('should handle authentication failure', async () => {
      // Mock service to throw an authentication error
      mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));

      const response = await request(app).post('/login').send(validLoginData).expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'Something went wrong',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
        },
        timestamp: expect.any(String),
      });
    });

    it('should handle user data retrieval failure', async () => {
      mockAuthService.login.mockResolvedValue(mockLoginResponse);
      mockAuthService.getUserFromToken.mockResolvedValue(null);

      const response = await request(app).post('/login').send(validLoginData).expect(500);

      expect(response.body).toEqual({
        error: 'Internal server error',
      });
    });

    it('should handle full user data retrieval failure', async () => {
      mockAuthService.login.mockResolvedValue(mockLoginResponse);
      mockAuthService.getUserFromToken.mockResolvedValue(mockLoginResponse.user);
      mockUserService.getUserById.mockResolvedValue(null);

      const response = await request(app).post('/login').send(validLoginData).expect(500);

      expect(response.body).toEqual({
        error: 'Internal server error',
      });
    });
  });
});
