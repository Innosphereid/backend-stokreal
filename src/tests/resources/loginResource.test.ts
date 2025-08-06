import { LoginResource } from '../../resources/loginResource';
import { LoginResponse as JWTLoginResponse } from '../../types/jwt';
import { User } from '../../types';

describe('LoginResource', () => {
  describe('formatLoginResponse', () => {
    it('should format login response correctly', () => {
      const mockUser: User = {
        id: '1',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test User',
        subscription_plan: 'free',
        is_active: true,
        email_verified: false,
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-01'),
      };

      const mockLoginData: JWTLoginResponse = {
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

      const result = LoginResource.formatLoginResponse(mockLoginData, mockUser);

      expect(result).toEqual({
        user: {
          id: '1',
          email: 'test@example.com',
          full_name: 'Test User',
          subscription_plan: 'free',
          subscription_expires_at: undefined,
        },
        tokens: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 86400,
        },
      });
    });

    it('should handle different user roles', () => {
      const mockUser: User = {
        id: '2',
        email: 'admin@example.com',
        password_hash: 'hashed_password',
        full_name: 'Admin User',
        subscription_plan: 'premium',
        is_active: true,
        email_verified: true,
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-01'),
      };

      const mockLoginData: JWTLoginResponse = {
        user: {
          id: '2',
          email: 'admin@example.com',
          role: 'admin',
          isActive: true,
        },
        tokens: {
          accessToken: 'admin-access-token',
          refreshToken: 'admin-refresh-token',
        },
        message: 'Admin login successful',
      };

      const result = LoginResource.formatLoginResponse(mockLoginData, mockUser);

      expect(result.user.id).toBe('2');
      expect(result.user.email).toBe('admin@example.com');
      expect(result.user.full_name).toBe('Admin User');
      expect(result.user.subscription_plan).toBe('premium');
    });

    it('should handle inactive users', () => {
      const mockUser: User = {
        id: '3',
        email: 'inactive@example.com',
        password_hash: 'hashed_password',
        full_name: 'Inactive User',
        subscription_plan: 'free',
        is_active: false,
        email_verified: false,
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-01'),
      };

      const mockLoginData: JWTLoginResponse = {
        user: {
          id: '3',
          email: 'inactive@example.com',
          role: 'user',
          isActive: false,
        },
        tokens: {
          accessToken: 'inactive-access-token',
          refreshToken: 'inactive-refresh-token',
        },
        message: 'Login successful',
      };

      const result = LoginResource.formatLoginResponse(mockLoginData, mockUser);

      expect(result.user.id).toBe('3');
      expect(result.user.email).toBe('inactive@example.com');
      expect(result.user.full_name).toBe('Inactive User');
      expect(result.user.subscription_plan).toBe('free');
    });

    it('should preserve all user fields from database', () => {
      const mockUser: User = {
        id: '4',
        email: 'complete@example.com',
        password_hash: 'hashed_password',
        full_name: 'Complete User',
        phone: '+1234567890',
        whatsapp_number: '+1234567890',
        subscription_plan: 'premium',
        subscription_expires_at: new Date('2024-01-01'),
        is_active: true,
        email_verified: true,
        last_login: new Date('2023-01-01T10:00:00Z'),
        created_at: new Date('2023-01-01T10:00:00Z'),
        updated_at: new Date('2023-01-01T11:00:00Z'),
      };

      const mockLoginData: JWTLoginResponse = {
        user: {
          id: '4',
          email: 'complete@example.com',
          role: 'moderator',
          isActive: true,
        },
        tokens: {
          accessToken: 'complete-access-token',
          refreshToken: 'complete-refresh-token',
        },
        message: 'Complete user login successful',
      };

      const result = LoginResource.formatLoginResponse(mockLoginData, mockUser);

      expect(result.user).toEqual({
        id: '4',
        email: 'complete@example.com',
        full_name: 'Complete User',
        subscription_plan: 'premium',
        subscription_expires_at: new Date('2024-01-01'),
      });
    });

    it('should handle different token formats', () => {
      const mockUser: User = {
        id: '5',
        email: 'token@example.com',
        password_hash: 'hashed_password',
        full_name: 'Token User',
        subscription_plan: 'free',
        is_active: true,
        email_verified: false,
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-01'),
      };

      const mockLoginData: JWTLoginResponse = {
        user: {
          id: '5',
          email: 'token@example.com',
          role: 'user',
          isActive: true,
        },
        tokens: {
          accessToken:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1IiwiaWF0IjoxNjM1NzI5NjAwLCJleHAiOjE2MzU3MzMyMDB9.signature',
          refreshToken:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1IiwiaWF0IjoxNjM1NzI5NjAwLCJleHAiOjE2MzU3MzMyMDB9.refresh_signature',
        },
        message: 'Token test successful',
      };

      const result = LoginResource.formatLoginResponse(mockLoginData, mockUser);

      expect(result.tokens.access_token).toMatch(/^eyJ/);
      expect(result.tokens.refresh_token).toMatch(/^eyJ/);
      expect(result.tokens.access_token).not.toBe(result.tokens.refresh_token);
      expect(result.tokens.expires_in).toBe(86400);
    });

    it('should handle empty or null values gracefully', () => {
      const mockUser: User = {
        id: '6',
        email: 'empty@example.com',
        password_hash: 'hashed_password',
        full_name: '',
        subscription_plan: 'free',
        is_active: false,
        email_verified: false,
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-01'),
      };

      const mockLoginData: JWTLoginResponse = {
        user: {
          id: '6',
          email: 'empty@example.com',
          role: '',
          isActive: false,
        },
        tokens: {
          accessToken: '',
          refreshToken: '',
        },
        message: '',
      };

      const result = LoginResource.formatLoginResponse(mockLoginData, mockUser);

      expect(result.user).toEqual({
        id: '6',
        email: 'empty@example.com',
        full_name: '',
        subscription_plan: 'free',
        subscription_expires_at: undefined,
      });

      expect(result.tokens).toEqual({
        access_token: '',
        refresh_token: '',
        expires_in: 86400,
      });
    });
  });
});
