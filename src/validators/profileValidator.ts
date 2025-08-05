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

    const sanitizedPhone = this.sanitizePhone(phone);
    if (!this.isValidIndonesianPhone(sanitizedPhone)) {
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

    const sanitizedWhatsApp = this.sanitizeWhatsApp(whatsapp);
    if (!this.isValidIndonesianWhatsApp(sanitizedWhatsApp)) {
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
      sanitized.phone = this.sanitizePhone(data.phone);
    }

    if (data.whatsapp_number !== undefined) {
      sanitized.whatsapp_number = this.sanitizeWhatsApp(data.whatsapp_number);
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
   * Sanitize phone number
   */
  private static sanitizePhone(input: string): string {
    return this.sanitizeContactNumber(input);
  }

  /**
   * Sanitize WhatsApp number
   */
  private static sanitizeWhatsApp(input: string): string {
    return this.sanitizeContactNumber(input);
  }

  /**
   * Sanitize contact number (phone or WhatsApp)
   */
  private static sanitizeContactNumber(input: string): string {
    // Remove spaces and keep only digits, +, and -
    const sanitized = input.trim().replace(/[^\d\s\-+]/g, '');

    // If it starts with +62, keep the +62 format
    if (sanitized.startsWith('+62')) {
      return sanitized.replace(/\s/g, '');
    }

    // If it starts with 08, keep the 08 format
    if (sanitized.startsWith('08')) {
      return sanitized.replace(/\s/g, '');
    }

    // Otherwise, just remove spaces
    return sanitized.replace(/\s/g, '');
  }

  /**
   * Validate Indonesian phone number format
   */
  private static isValidIndonesianPhone(phone: string): boolean {
    // Remove all non-digit characters for validation
    const digits = phone.replace(/\D/g, '');

    // Check if it's a valid Indonesian phone number
    // +62 format: +62 followed by 8-12 digits
    // 08 format: 08 followed by 8-10 digits
    const plus62Pattern = /^\+62\d{8,12}$/;
    const zero8Pattern = /^08\d{8,10}$/;

    return plus62Pattern.test(phone) || zero8Pattern.test(digits);
  }

  /**
   * Validate Indonesian WhatsApp number format
   */
  private static isValidIndonesianWhatsApp(whatsapp: string): boolean {
    // Remove all non-digit characters for validation
    const digits = whatsapp.replace(/\D/g, '');

    // Check if it's a valid Indonesian WhatsApp number
    // +62 format: +62 followed by 8-12 digits
    // 08 format: 08 followed by 8-10 digits
    const plus62Pattern = /^\+62\d{8,12}$/;
    const zero8Pattern = /^08\d{8,10}$/;

    return plus62Pattern.test(whatsapp) || zero8Pattern.test(digits);
  }
}
