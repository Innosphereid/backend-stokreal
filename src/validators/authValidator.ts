import { RegisterRequest, ValidationError, ValidationResult } from '@/types/auth';

export class AuthValidator {
  /**
   * Validate registration request
   */
  static validateRegisterRequest(data: RegisterRequest): ValidationResult {
    const errors: ValidationError[] = [];

    // Check if all required fields are present
    if (!data.email) {
      errors.push({ field: 'email', message: 'Email is required' });
    }

    if (!data.full_name) {
      errors.push({ field: 'full_name', message: 'Full name is required' });
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

    // Validate full name (only if full_name exists)
    if (data.full_name) {
      if (data.full_name.length < 2) {
        errors.push({
          field: 'full_name',
          message: 'Full name must be at least 2 characters long',
        });
      }

      if (data.full_name.length > 255) {
        errors.push({ field: 'full_name', message: 'Full name must be less than 255 characters' });
      }
    }

    // Validate phone number (optional)
    if (data.phone) {
      const phoneRegex = /^[\d\s\-+()]+$/;
      if (!phoneRegex.test(data.phone)) {
        errors.push({ field: 'phone', message: 'Invalid phone number format' });
      }

      if (data.phone.length > 20) {
        errors.push({ field: 'phone', message: 'Phone number must be less than 20 characters' });
      }
    }

    // Validate WhatsApp number (optional) - Indonesian format
    if (data.whatsapp_number) {
      const whatsappRegex = /^(\+62|62|0)8[1-9][0-9]{6,9}$/;
      if (!whatsappRegex.test(data.whatsapp_number)) {
        errors.push({
          field: 'whatsapp_number',
          message: 'WhatsApp number must be in Indonesian format (+62xxx or 08xxx)',
        });
      }

      if (data.whatsapp_number.length > 20) {
        errors.push({
          field: 'whatsapp_number',
          message: 'WhatsApp number must be less than 20 characters',
        });
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
  static sanitizeRegisterData(data: Record<string, unknown>): RegisterRequest {
    return {
      email: (data.email as string)?.trim()?.toLowerCase() || (data.email as string),
      full_name: (data.full_name as string)?.trim() || (data.full_name as string),
      phone: (data.phone as string)?.trim() || (data.phone as string),
      whatsapp_number: (data.whatsapp_number as string)?.trim() || (data.whatsapp_number as string),
      password: data.password as string,
      confirm_password: data.confirm_password as string,
    };
  }
}
