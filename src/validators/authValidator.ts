import { RegisterRequest, ValidationError, ValidationResult } from '@/types/auth';

export class AuthValidator {
  /**
   * Validate registration request
   */
  static validateRegisterRequest(data: RegisterRequest): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate required fields first
    const requiredErrors = this.validateRequiredFields(data);
    errors.push(...requiredErrors);

    if (requiredErrors.length > 0) {
      return { isValid: false, errors };
    }

    // Validate individual fields
    errors.push(...this.validateEmail(data.email));
    errors.push(...this.validateFullName(data.full_name));
    errors.push(...this.validatePhone(data.phone));
    errors.push(...this.validateWhatsApp(data.whatsapp_number));
    errors.push(...this.validatePassword(data.password));
    errors.push(...this.validatePasswordConfirmation(data.password, data.confirm_password));

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate required fields
   */
  private static validateRequiredFields(data: RegisterRequest): ValidationError[] {
    const errors: ValidationError[] = [];

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

    return errors;
  }

  /**
   * Validate email format and length
   */
  private static validateEmail(email?: string): ValidationError[] {
    if (!email) return [];

    const errors: ValidationError[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      errors.push({ field: 'email', message: 'Invalid email format' });
    }
    if (email.length > 255) {
      errors.push({ field: 'email', message: 'Email must be less than 255 characters' });
    }

    return errors;
  }

  /**
   * Validate full name
   */
  private static validateFullName(fullName?: string): ValidationError[] {
    if (!fullName) return [];

    const errors: ValidationError[] = [];

    if (fullName.length < 2) {
      errors.push({
        field: 'full_name',
        message: 'Full name must be at least 2 characters long',
      });
    }
    if (fullName.length > 255) {
      errors.push({ field: 'full_name', message: 'Full name must be less than 255 characters' });
    }

    return errors;
  }

  /**
   * Validate phone number
   */
  private static validatePhone(phone?: string): ValidationError[] {
    if (!phone) return [];

    const errors: ValidationError[] = [];
    const phoneRegex = /^[\d\s\-+()]+$/;

    if (!phoneRegex.test(phone)) {
      errors.push({ field: 'phone', message: 'Invalid phone number format' });
    }
    if (phone.length > 20) {
      errors.push({ field: 'phone', message: 'Phone number must be less than 20 characters' });
    }

    return errors;
  }

  /**
   * Validate WhatsApp number
   */
  private static validateWhatsApp(whatsapp?: string): ValidationError[] {
    if (!whatsapp) return [];

    const errors: ValidationError[] = [];
    const whatsappRegex = /^(\+62|62|0)8[1-9]\d{6,9}$/;

    if (!whatsappRegex.test(whatsapp)) {
      errors.push({
        field: 'whatsapp_number',
        message: 'WhatsApp number must be in Indonesian format (+62xxx or 08xxx)',
      });
    }
    if (whatsapp.length > 20) {
      errors.push({
        field: 'whatsapp_number',
        message: 'WhatsApp number must be less than 20 characters',
      });
    }

    return errors;
  }

  /**
   * Validate password strength
   */
  private static validatePassword(password?: string): ValidationError[] {
    if (!password) return [];

    const errors: ValidationError[] = [];

    if (password.length < 8) {
      errors.push({ field: 'password', message: 'Password must be at least 8 characters long' });
    }
    if (password.length > 128) {
      errors.push({ field: 'password', message: 'Password must be less than 128 characters' });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(password)) {
      errors.push({
        field: 'password',
        message:
          'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      });
    }

    return errors;
  }

  /**
   * Validate password confirmation
   */
  private static validatePasswordConfirmation(
    password?: string,
    confirmPassword?: string
  ): ValidationError[] {
    if (!password || !confirmPassword) return [];

    const errors: ValidationError[] = [];

    if (password !== confirmPassword) {
      errors.push({ field: 'confirm_password', message: 'Passwords do not match' });
    }

    return errors;
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
