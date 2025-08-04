import { RegisterRequest, ValidationError, ValidationResult } from '@/types/auth';

export class AuthValidator {
  /**
   * Validate registration request
   */
  static validateRegisterRequest(data: any): ValidationResult {
    const errors: ValidationError[] = [];

    // Check if all required fields are present
    if (!data.email) {
      errors.push({ field: 'email', message: 'Email is required' });
    }

    if (!data.username) {
      errors.push({ field: 'username', message: 'Username is required' });
    }

    if (!data.first_name) {
      errors.push({ field: 'first_name', message: 'First name is required' });
    }

    if (!data.last_name) {
      errors.push({ field: 'last_name', message: 'Last name is required' });
    }

    if (!data.password) {
      errors.push({ field: 'password', message: 'Password is required' });
    }

    if (!data.confirm_password) {
      errors.push({ field: 'confirm_password', message: 'Password confirmation is required' });
    }

    // If there are missing required fields, return early to avoid confusing validation messages
    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    // Validate email format and length (only if email exists)
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.push({ field: 'email', message: 'Invalid email format' });
      }

      if (data.email.length > 255) {
        errors.push({ field: 'email', message: 'Email must be less than 255 characters' });
      }
    }

    // Validate first name (only if first_name exists)
    if (data.first_name) {
      if (data.first_name.length < 1) {
        errors.push({ field: 'first_name', message: 'First name cannot be empty' });
      }

      if (data.first_name.length > 50) {
        errors.push({ field: 'first_name', message: 'First name must be less than 50 characters' });
      }
    }

    // Validate last name (only if last_name exists)
    if (data.last_name) {
      if (data.last_name.length < 1) {
        errors.push({ field: 'last_name', message: 'Last name cannot be empty' });
      }

      if (data.last_name.length > 50) {
        errors.push({ field: 'last_name', message: 'Last name must be less than 50 characters' });
      }
    }

    // Validate username format and length (only if username exists)
    if (data.username) {
      const usernameRegex = /^[a-zA-Z0-9_]+$/;
      if (!usernameRegex.test(data.username)) {
        errors.push({
          field: 'username',
          message: 'Username can only contain letters, numbers, and underscores',
        });
      }

      if (data.username.length < 3) {
        errors.push({ field: 'username', message: 'Username must be at least 3 characters long' });
      }

      if (data.username.length > 30) {
        errors.push({ field: 'username', message: 'Username must be less than 30 characters' });
      }
    }

    // Validate password strength (only if password exists)
    if (data.password) {
      if (data.password.length < 8) {
        errors.push({ field: 'password', message: 'Password must be at least 8 characters long' });
      }

      if (data.password.length > 128) {
        errors.push({ field: 'password', message: 'Password must be less than 128 characters' });
      }

      // Check for password complexity (at least one uppercase, one lowercase, one number)
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
      if (!passwordRegex.test(data.password)) {
        errors.push({
          field: 'password',
          message:
            'Password must contain at least one uppercase letter, one lowercase letter, and one number',
        });
      }
    }

    // Validate password confirmation (only if both passwords exist)
    if (data.password && data.confirm_password && data.password !== data.confirm_password) {
      errors.push({ field: 'confirm_password', message: 'Passwords do not match' });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Sanitize registration data
   */
  static sanitizeRegisterData(data: any): RegisterRequest {
    return {
      email: data.email?.trim()?.toLowerCase() || data.email,
      username: data.username?.trim()?.toLowerCase() || data.username,
      first_name: data.first_name?.trim() || data.first_name,
      last_name: data.last_name?.trim() || data.last_name,
      password: data.password,
      confirm_password: data.confirm_password,
    };
  }
}
