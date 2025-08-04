import { LoginResource } from '../../resources/loginResource';
import { LoginResponse as JWTLoginResponse } from '../../types/jwt';
import { User } from '../../types';

describe('LoginResource', () => {
  describe('formatLoginResponse', () => {
    it('should format login response correctly', () => {
      const mockUser: User = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        first_name: 'Test',
        last_name: 'User',
        is_active: true,
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
          username: 'testuser',
          first_name: 'Test',
          last_name: 'User',
          role: 'user',
          is_active: true,
        },
        tokens: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
        },
      });
    });

    it('should handle different user roles', () => {
      const mockUser: User = {
        id: 2,
        email: 'admin@example.com',
        username: 'adminuser',
        first_name: 'Admin',
        last_name: 'User',
        is_active: true,
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

      expect(result.user.role).toBe('admin');
    });

    it('should handle inactive users', () => {
      const mockUser: User = {
        id: 3,
        email: 'inactive@example.com',
        username: 'inactiveuser',
        first_name: 'Inactive',
        last_name: 'User',
        is_active: false,
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

      expect(result.user.is_active).toBe(false);
      expect(result.user.id).toBe('3');
    });

    it('should preserve all user fields from database', () => {
      const mockUser: User = {
        id: 4,
        email: 'complete@example.com',
        username: 'completeuser',
        first_name: 'Complete',
        last_name: 'User',
        is_active: true,
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
        username: 'completeuser',
        first_name: 'Complete',
        last_name: 'User',
        role: 'moderator',
        is_active: true,
      });
    });

    it('should handle different token formats', () => {
      const mockUser: User = {
        id: 5,
        email: 'token@example.com',
        username: 'tokenuser',
        first_name: 'Token',
        last_name: 'User',
        is_active: true,
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
    });

    it('should handle empty or null values gracefully', () => {
      const mockUser: User = {
        id: 6,
        email: 'empty@example.com',
        username: '',
        first_name: '',
        last_name: '',
        is_active: false,
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
        username: '',
        first_name: '',
        last_name: '',
        role: '',
        is_active: false,
      });

      expect(result.tokens).toEqual({
        access_token: '',
        refresh_token: '',
      });
    });
  });
});
