import { LoginValidator } from '../../validators/loginValidator';

describe('LoginValidator', () => {
  describe('validateLoginRequest', () => {
    it('should validate valid login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123',
      };

      const result = LoginValidator.validateLoginRequest(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate valid login data with remember_me', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123',
        remember_me: true,
      };

      const result = LoginValidator.validateLoginRequest(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return error for missing email', () => {
      const invalidData = {
        password: 'Password123',
      };

      const result = LoginValidator.validateLoginRequest(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        field: 'email',
        message: 'Email is required',
      });
    });

    it('should return error for missing password', () => {
      const invalidData = {
        email: 'test@example.com',
      };

      const result = LoginValidator.validateLoginRequest(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        field: 'password',
        message: 'Password is required',
      });
    });

    it('should return error for invalid email format', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'Password123',
      };

      const result = LoginValidator.validateLoginRequest(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        field: 'email',
        message: 'Invalid email format',
      });
    });

    it('should return error for email too long', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      const invalidData = {
        email: longEmail,
        password: 'Password123',
      };

      const result = LoginValidator.validateLoginRequest(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        field: 'email',
        message: 'Email must be less than 255 characters',
      });
    });

    it('should return error for empty password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '',
      };

      const result = LoginValidator.validateLoginRequest(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        field: 'password',
        message: 'Password is required',
      });
    });

    it('should return error for password too long', () => {
      const longPassword = 'a'.repeat(129);
      const invalidData = {
        email: 'test@example.com',
        password: longPassword,
      };

      const result = LoginValidator.validateLoginRequest(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        field: 'password',
        message: 'Password must be less than 128 characters',
      });
    });

    it('should return error for invalid remember_me type', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Password123',
        remember_me: 'not-a-boolean',
      };

      const result = LoginValidator.validateLoginRequest(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        field: 'remember_me',
        message: 'Remember me must be a boolean value',
      });
    });

    it('should accept remember_me as string "true"', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123',
        remember_me: 'true',
      };

      const result = LoginValidator.validateLoginRequest(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept remember_me as string "false"', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123',
        remember_me: 'false',
      };

      const result = LoginValidator.validateLoginRequest(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return multiple errors for multiple invalid fields', () => {
      const invalidData = {
        email: 'invalid-email',
        password: '',
        remember_me: 'not-a-boolean',
      };

      const result = LoginValidator.validateLoginRequest(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          { field: 'email', message: 'Invalid email format' },
          { field: 'password', message: 'Password cannot be empty' },
          { field: 'remember_me', message: 'Remember me must be a boolean value' },
        ])
      );
    });
  });

  describe('sanitizeLoginData', () => {
    it('should sanitize email by trimming and converting to lowercase', () => {
      const rawData = {
        email: '  TEST@EXAMPLE.COM  ',
        password: 'Password123',
      };

      const result = LoginValidator.sanitizeLoginData(rawData);

      expect(result).toEqual({
        email: 'test@example.com',
        password: 'Password123',
        remember_me: false,
      });
    });

    it('should handle undefined remember_me', () => {
      const rawData = {
        email: 'test@example.com',
        password: 'Password123',
      };

      const result = LoginValidator.sanitizeLoginData(rawData);

      expect(result).toEqual({
        email: 'test@example.com',
        password: 'Password123',
        remember_me: false,
      });
    });

    it('should convert string "true" to boolean true for remember_me', () => {
      const rawData = {
        email: 'test@example.com',
        password: 'Password123',
        remember_me: 'true',
      };

      const result = LoginValidator.sanitizeLoginData(rawData);

      expect(result).toEqual({
        email: 'test@example.com',
        password: 'Password123',
        remember_me: true,
      });
    });

    it('should convert boolean true to boolean true for remember_me', () => {
      const rawData = {
        email: 'test@example.com',
        password: 'Password123',
        remember_me: true,
      };

      const result = LoginValidator.sanitizeLoginData(rawData);

      expect(result).toEqual({
        email: 'test@example.com',
        password: 'Password123',
        remember_me: true,
      });
    });

    it('should convert string "false" to boolean false for remember_me', () => {
      const rawData = {
        email: 'test@example.com',
        password: 'Password123',
        remember_me: 'false',
      };

      const result = LoginValidator.sanitizeLoginData(rawData);

      expect(result).toEqual({
        email: 'test@example.com',
        password: 'Password123',
        remember_me: false,
      });
    });

    it('should handle null and undefined values gracefully', () => {
      const rawData = {
        email: null,
        password: undefined,
        remember_me: null,
      };

      const result = LoginValidator.sanitizeLoginData(rawData);

      expect(result).toEqual({
        email: null,
        password: undefined,
        remember_me: false,
      });
    });

    it('should preserve password as-is', () => {
      const rawData = {
        email: 'test@example.com',
        password: '  Password123  ',
      };

      const result = LoginValidator.sanitizeLoginData(rawData);

      expect(result).toEqual({
        email: 'test@example.com',
        password: '  Password123  ',
        remember_me: false,
      });
    });
  });
});
