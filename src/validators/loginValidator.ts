import { LoginRequest, ValidationError, ValidationResult } from '@/types/auth';

export class LoginValidator {
  /**
   * Validate login request
   */
  static validateLoginRequest(data: any): ValidationResult {
    const errors: ValidationError[] = [];

    // Check if all required fields are present
    if (!data.email) {
      errors.push({ field: 'email', message: 'Email is required' });
    }

    if (!data.password) {
      errors.push({ field: 'password', message: 'Password is required' });
    }

    // Don't return early - collect all validation errors

    // Validate email format (only if email exists)
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.push({ field: 'email', message: 'Invalid email format' });
      }

      if (data.email.length > 255) {
        errors.push({ field: 'email', message: 'Email must be less than 255 characters' });
      }
    }

    // Validate password (only if password exists)
    if (data.password) {
      if (data.password.length < 1) {
        errors.push({ field: 'password', message: 'Password cannot be empty' });
      }

      if (data.password.length > 128) {
        errors.push({ field: 'password', message: 'Password must be less than 128 characters' });
      }
    }

    // Validate remember_me (optional boolean)
    if (
      data.remember_me !== undefined &&
      typeof data.remember_me !== 'boolean' &&
      data.remember_me !== 'true' &&
      data.remember_me !== 'false'
    ) {
      errors.push({ field: 'remember_me', message: 'Remember me must be a boolean value' });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Sanitize login data
   */
  static sanitizeLoginData(data: any): LoginRequest {
    return {
      email: data.email?.trim()?.toLowerCase() || data.email,
      password: data.password,
      remember_me: data.remember_me === true || data.remember_me === 'true',
    };
  }
}
