import { AuthValidator } from '../../validators/authValidator';

describe('AuthValidator', () => {
  describe('validateRegisterRequest', () => {
    const validData = {
      email: 'test@example.com',
      username: 'testuser',
      first_name: 'Test',
      last_name: 'User',
      password: 'Password123',
      confirm_password: 'Password123',
    };

    it('should validate correct registration data', () => {
      const result = AuthValidator.validateRegisterRequest(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return error for missing email', () => {
      const invalidData = {
        username: validData.username,
        first_name: validData.first_name,
        last_name: validData.last_name,
        password: validData.password,
        confirm_password: validData.confirm_password,
      };

      const result = AuthValidator.validateRegisterRequest(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'email',
        message: 'Email is required',
      });
    });

    it('should return error for missing username', () => {
      const invalidData = {
        email: validData.email,
        first_name: validData.first_name,
        last_name: validData.last_name,
        password: validData.password,
        confirm_password: validData.confirm_password,
      };

      const result = AuthValidator.validateRegisterRequest(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'username',
        message: 'Username is required',
      });
    });

    it('should return error for missing first_name', () => {
      const invalidData = {
        email: validData.email,
        username: validData.username,
        last_name: validData.last_name,
        password: validData.password,
        confirm_password: validData.confirm_password,
      };

      const result = AuthValidator.validateRegisterRequest(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'first_name',
        message: 'First name is required',
      });
    });

    it('should return error for missing last_name', () => {
      const invalidData = {
        email: validData.email,
        username: validData.username,
        first_name: validData.first_name,
        password: validData.password,
        confirm_password: validData.confirm_password,
      };

      const result = AuthValidator.validateRegisterRequest(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'last_name',
        message: 'Last name is required',
      });
    });

    it('should return error for missing password', () => {
      const invalidData = {
        email: validData.email,
        username: validData.username,
        first_name: validData.first_name,
        last_name: validData.last_name,
        confirm_password: validData.confirm_password,
      };

      const result = AuthValidator.validateRegisterRequest(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'password',
        message: 'Password is required',
      });
    });

    it('should return error for missing confirm_password', () => {
      const invalidData = {
        email: validData.email,
        username: validData.username,
        first_name: validData.first_name,
        last_name: validData.last_name,
        password: validData.password,
      };

      const result = AuthValidator.validateRegisterRequest(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'confirm_password',
        message: 'Password confirmation is required',
      });
    });

    it('should return error for invalid email format', () => {
      const invalidData = { ...validData, email: 'invalid-email' };

      const result = AuthValidator.validateRegisterRequest(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'email',
        message: 'Invalid email format',
      });
    });

    it('should return error for email too long', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      const invalidData = { ...validData, email: longEmail };

      const result = AuthValidator.validateRegisterRequest(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'email',
        message: 'Email must be less than 255 characters',
      });
    });

    it('should return error for invalid username format', () => {
      const invalidData = { ...validData, username: 'invalid-username!' };

      const result = AuthValidator.validateRegisterRequest(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'username',
        message: 'Username can only contain letters, numbers, and underscores',
      });
    });

    it('should return error for username too short', () => {
      const invalidData = { ...validData, username: 'ab' };

      const result = AuthValidator.validateRegisterRequest(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'username',
        message: 'Username must be at least 3 characters long',
      });
    });

    it('should return error for username too long', () => {
      const invalidData = { ...validData, username: 'a'.repeat(31) };

      const result = AuthValidator.validateRegisterRequest(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'username',
        message: 'Username must be less than 30 characters',
      });
    });

    it('should return error for empty first name', () => {
      const invalidData = { ...validData, first_name: '' };

      const result = AuthValidator.validateRegisterRequest(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'first_name',
        message: 'First name is required',
      });
    });

    it('should return error for first name too long', () => {
      const invalidData = { ...validData, first_name: 'a'.repeat(51) };

      const result = AuthValidator.validateRegisterRequest(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'first_name',
        message: 'First name must be less than 50 characters',
      });
    });

    it('should return error for empty last name', () => {
      const invalidData = { ...validData, last_name: '' };

      const result = AuthValidator.validateRegisterRequest(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'last_name',
        message: 'Last name is required',
      });
    });

    it('should return error for last name too long', () => {
      const invalidData = { ...validData, last_name: 'a'.repeat(51) };

      const result = AuthValidator.validateRegisterRequest(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'last_name',
        message: 'Last name must be less than 50 characters',
      });
    });

    it('should return error for password too short', () => {
      const invalidData = { ...validData, password: 'weak', confirm_password: 'weak' };

      const result = AuthValidator.validateRegisterRequest(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'password',
        message: 'Password must be at least 8 characters long',
      });
    });

    it('should return error for password too long', () => {
      const invalidData = {
        ...validData,
        password: 'a'.repeat(129),
        confirm_password: 'a'.repeat(129),
      };

      const result = AuthValidator.validateRegisterRequest(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'password',
        message: 'Password must be less than 128 characters',
      });
    });

    it('should return error for password without uppercase', () => {
      const invalidData = {
        ...validData,
        password: 'password123',
        confirm_password: 'password123',
      };

      const result = AuthValidator.validateRegisterRequest(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'password',
        message:
          'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      });
    });

    it('should return error for password without lowercase', () => {
      const invalidData = {
        ...validData,
        password: 'PASSWORD123',
        confirm_password: 'PASSWORD123',
      };

      const result = AuthValidator.validateRegisterRequest(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'password',
        message:
          'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      });
    });

    it('should return error for password without number', () => {
      const invalidData = {
        ...validData,
        password: 'PasswordABC',
        confirm_password: 'PasswordABC',
      };

      const result = AuthValidator.validateRegisterRequest(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'password',
        message:
          'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      });
    });

    it('should return error for mismatched passwords', () => {
      const invalidData = { ...validData, confirm_password: 'DifferentPassword123' };

      const result = AuthValidator.validateRegisterRequest(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'confirm_password',
        message: 'Passwords do not match',
      });
    });

    it('should return multiple errors for multiple validation failures', () => {
      const invalidData = {
        email: 'invalid-email',
        username: 'ab',
        first_name: 'Test',
        last_name: 'User',
        password: 'weak',
        confirm_password: 'different',
      };

      const result = AuthValidator.validateRegisterRequest(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContainEqual({
        field: 'email',
        message: 'Invalid email format',
      });
      expect(result.errors).toContainEqual({
        field: 'username',
        message: 'Username must be at least 3 characters long',
      });
    });
  });

  describe('sanitizeRegisterData', () => {
    it('should sanitize registration data correctly', () => {
      const unsanitizedData = {
        email: '  TEST@EXAMPLE.COM  ',
        username: '  TESTUSER  ',
        first_name: '  Test  ',
        last_name: '  User  ',
        password: 'Password123',
        confirm_password: 'Password123',
      };

      const result = AuthValidator.sanitizeRegisterData(unsanitizedData);

      expect(result).toEqual({
        email: 'test@example.com',
        username: 'testuser',
        first_name: 'Test',
        last_name: 'User',
        password: 'Password123',
        confirm_password: 'Password123',
      });
    });

    it('should handle undefined values gracefully', () => {
      const dataWithUndefined = {
        email: undefined,
        username: undefined,
        first_name: undefined,
        last_name: undefined,
        password: undefined,
        confirm_password: undefined,
      };

      const result = AuthValidator.sanitizeRegisterData(dataWithUndefined);

      expect(result).toEqual({
        email: undefined,
        username: undefined,
        first_name: undefined,
        last_name: undefined,
        password: undefined,
        confirm_password: undefined,
      });
    });

    it('should handle null values gracefully', () => {
      const dataWithNull = {
        email: null,
        username: null,
        first_name: null,
        last_name: null,
        password: null,
        confirm_password: null,
      };

      const result = AuthValidator.sanitizeRegisterData(dataWithNull);

      expect(result).toEqual({
        email: null,
        username: null,
        first_name: null,
        last_name: null,
        password: null,
        confirm_password: null,
      });
    });
  });
});
