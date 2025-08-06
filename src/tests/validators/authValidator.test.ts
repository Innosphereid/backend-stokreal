import { AuthValidator } from '../../validators/authValidator';

describe('AuthValidator', () => {
  describe('validateRegisterRequest', () => {
    const validData = {
      email: 'test@example.com',
      full_name: 'Test User',
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
        full_name: validData.full_name,
        password: validData.password,
        confirm_password: validData.confirm_password,
      } as any;

      const result = AuthValidator.validateRegisterRequest(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'email',
        message: 'Email is required',
      });
    });

    it('should return error for missing full_name', () => {
      const invalidData = {
        email: validData.email,
        password: validData.password,
        confirm_password: validData.confirm_password,
      } as any;

      const result = AuthValidator.validateRegisterRequest(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'full_name',
        message: 'Full name is required',
      });
    });

    it('should return error for missing password', () => {
      const invalidData = {
        email: validData.email,
        full_name: validData.full_name,
        confirm_password: validData.confirm_password,
      } as any;

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
        full_name: validData.full_name,
        password: validData.password,
      } as any;

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

    it('should return error for empty full name', () => {
      const invalidData = { ...validData, full_name: '' };

      const result = AuthValidator.validateRegisterRequest(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'full_name',
        message: 'Full name is required',
      });
    });

    it('should return error for full name too short', () => {
      const invalidData = { ...validData, full_name: 'A' };

      const result = AuthValidator.validateRegisterRequest(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'full_name',
        message: 'Full name must be at least 2 characters long',
      });
    });

    it('should return error for full name too long', () => {
      const invalidData = { ...validData, full_name: 'a'.repeat(256) };

      const result = AuthValidator.validateRegisterRequest(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'full_name',
        message: 'Full name must be less than 255 characters',
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
        full_name: 'A',
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
        field: 'full_name',
        message: 'Full name must be at least 2 characters long',
      });
    });

    it('should validate phone number format', () => {
      const validDataWithPhone = {
        ...validData,
        phone: '+628123456789',
      };

      const result = AuthValidator.validateRegisterRequest(validDataWithPhone);
      expect(result.isValid).toBe(true);
    });

    it('should return error for invalid phone number format', () => {
      const invalidData = {
        ...validData,
        phone: 'invalid-phone',
      };

      const result = AuthValidator.validateRegisterRequest(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'phone',
        message: 'Invalid phone number format',
      });
    });

    it('should validate WhatsApp number format', () => {
      const validDataWithWhatsApp = {
        ...validData,
        whatsapp_number: '+628123456789',
      };

      const result = AuthValidator.validateRegisterRequest(validDataWithWhatsApp);
      expect(result.isValid).toBe(true);
    });

    it('should return error for invalid WhatsApp number format', () => {
      const invalidData = {
        ...validData,
        whatsapp_number: 'invalid-whatsapp',
      };

      const result = AuthValidator.validateRegisterRequest(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'whatsapp_number',
        message: 'WhatsApp number must be in Indonesian format (+62xxx or 08xxx)',
      });
    });
  });

  describe('sanitizeRegisterData', () => {
    it('should sanitize registration data correctly', () => {
      const unsanitizedData = {
        email: '  TEST@EXAMPLE.COM  ',
        full_name: '  Test User  ',
        password: 'Password123',
        confirm_password: 'Password123',
      };

      const result = AuthValidator.sanitizeRegisterData(unsanitizedData);

      expect(result).toEqual({
        email: 'test@example.com',
        full_name: 'Test User',
        password: 'Password123',
        confirm_password: 'Password123',
        phone: undefined,
        whatsapp_number: undefined,
      });
    });

    it('should handle undefined values gracefully', () => {
      const dataWithUndefined = {
        email: undefined,
        full_name: undefined,
        password: undefined,
        confirm_password: undefined,
      };

      const result = AuthValidator.sanitizeRegisterData(dataWithUndefined);

      expect(result).toEqual({
        email: undefined,
        full_name: undefined,
        password: undefined,
        confirm_password: undefined,
        phone: undefined,
        whatsapp_number: undefined,
      });
    });

    it('should handle null values gracefully', () => {
      const dataWithNull = {
        email: null,
        full_name: null,
        password: null,
        confirm_password: null,
      };

      const result = AuthValidator.sanitizeRegisterData(dataWithNull);

      expect(result).toEqual({
        email: null,
        full_name: null,
        password: null,
        confirm_password: null,
        phone: undefined,
        whatsapp_number: undefined,
      });
    });
  });
});
