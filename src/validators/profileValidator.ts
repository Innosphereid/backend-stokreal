import { UpdateUserRequest } from '@/types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: UpdateUserRequest;
}

export class ProfileValidator {
  /**
   * Validate profile update request
   */
  static validateProfileUpdate(data: UpdateUserRequest): ValidationResult {
    const errors: string[] = [];

    // Validate individual fields
    errors.push(...this.validateFullName(data.full_name));
    errors.push(...this.validatePhone(data.phone));
    errors.push(...this.validateWhatsApp(data.whatsapp_number));

    // If there are errors, return them
    if (errors.length > 0) {
      return {
        isValid: false,
        errors,
      };
    }

    // Sanitize and return valid data
    const sanitizedData = this.sanitizeProfileData(data);

    return {
      isValid: true,
      errors: [],
      sanitizedData,
    };
  }

  /**
   * Validate full name
   */
  private static validateFullName(fullName?: string): string[] {
    if (fullName === undefined) return [];

    if (typeof fullName !== 'string') {
      return ['Full name must be a string'];
    }

    const trimmed = fullName.trim();
    if (trimmed.length === 0) {
      return ['Full name cannot be empty'];
    }
    if (trimmed.length < 2) {
      return ['Full name must be at least 2 characters long'];
    }
    if (trimmed.length > 100) {
      return ['Full name cannot exceed 100 characters'];
    }

    return [];
  }

  /**
   * Validate phone number
   */
  private static validatePhone(phone?: string): string[] {
    if (phone === undefined) return [];

    if (typeof phone !== 'string') {
      return ['Phone number must be a string'];
    }

    const sanitizedPhone = this.sanitizeContactNumber(phone);
    if (!this.isValidIndonesianContactNumber(sanitizedPhone)) {
      return ['Phone number must be in valid Indonesian format (+62xxx or 08xxx)'];
    }

    return [];
  }

  /**
   * Validate WhatsApp number
   */
  private static validateWhatsApp(whatsapp?: string): string[] {
    if (whatsapp === undefined) return [];

    if (typeof whatsapp !== 'string') {
      return ['WhatsApp number must be a string'];
    }

    const sanitizedWhatsApp = this.sanitizeContactNumber(whatsapp);
    if (!this.isValidIndonesianContactNumber(sanitizedWhatsApp)) {
      return ['WhatsApp number must be in valid Indonesian format (+62xxx or 08xxx)'];
    }

    return [];
  }

  /**
   * Sanitize profile update data
   */
  static sanitizeProfileData(data: UpdateUserRequest): UpdateUserRequest {
    const sanitized: UpdateUserRequest = {};

    if (data.full_name !== undefined) {
      sanitized.full_name = this.sanitizeString(data.full_name);
    }

    if (data.phone !== undefined) {
      sanitized.phone = this.sanitizeContactNumber(data.phone);
    }

    if (data.whatsapp_number !== undefined) {
      sanitized.whatsapp_number = this.sanitizeContactNumber(data.whatsapp_number);
    }

    return sanitized;
  }

  /**
   * Sanitize string input
   */
  private static sanitizeString(input: string): string {
    return input.trim().replace(/\s+/g, ' ');
  }

  /**
   * Sanitize contact number (phone or WhatsApp)
   */
  private static sanitizeContactNumber(input: string): string {
    // Remove spaces, dashes, and other separators, keep only digits and +
    const sanitized = input.trim().replace(/[\s\-().]/g, '');

    // Return the sanitized string (both +62 and 08 formats are preserved)
    return sanitized;
  }

  /**
   * Validate Indonesian contact number format (phone or WhatsApp)
   */
  private static isValidIndonesianContactNumber(contact: string): boolean {
    // Check if it's a valid Indonesian contact number
    // +62 format: +62 followed by 8-12 digits
    // 08 format: 08 followed by 8-10 digits
    const plus62Pattern = /^\+62\d{8,12}$/;
    const zero8Pattern = /^08\d{8,10}$/;

    return plus62Pattern.test(contact) || zero8Pattern.test(contact);
  }
}
