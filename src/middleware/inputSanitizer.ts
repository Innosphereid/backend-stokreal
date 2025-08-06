import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';

interface SanitizableBody {
  email?: string;
  full_name?: string;
  phone?: string;
  whatsapp_number?: string;
  password?: string;
  confirm_password?: string;
  remember_me?: boolean;
  [key: string]: unknown;
}

interface SanitizableObject {
  [key: string]: unknown;
}

/**
 * Sanitize string input by removing dangerous characters and trimming whitespace
 */
function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, ''); // Remove vbscript: protocol
}

/**
 * Sanitize email input
 */
function sanitizeEmail(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input.trim().toLowerCase();
}

/**
 * Sanitize phone number input
 */
function sanitizePhone(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input.trim().replace(/[^\d\s\-+()]/g, '');
}

/**
 * Sanitize WhatsApp number input
 */
function sanitizeWhatsApp(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input.trim().replace(/[^\d\s\-+]/g, '');
}

/**
 * Sanitize request body fields
 */
function sanitizeBody(body: SanitizableBody): void {
  if (!body) return;

  // Sanitize common fields
  if (body.email) {
    body.email = sanitizeEmail(body.email);
  }

  if (body.full_name) {
    body.full_name = sanitizeString(body.full_name);
  }

  if (body.phone) {
    body.phone = sanitizePhone(body.phone);
  }

  if (body.whatsapp_number) {
    body.whatsapp_number = sanitizeWhatsApp(body.whatsapp_number);
  }

  // Sanitize password fields (only trim)
  if (body.password) {
    body.password = body.password.trim();
  }

  if (body.confirm_password) {
    body.confirm_password = body.confirm_password.trim();
  }

  // Sanitize other string fields
  Object.keys(body).forEach(key => {
    if (typeof body[key] === 'string' && !['password', 'confirm_password'].includes(key)) {
      body[key] = sanitizeString(body[key]);
    }
  });
}

/**
 * Sanitize object with string values
 */
function sanitizeObject(obj: SanitizableObject, sanitizer: (value: string) => string): void {
  if (!obj) return;

  Object.keys(obj).forEach(key => {
    if (typeof obj[key] === 'string') {
      obj[key] = sanitizer(obj[key]);
    }
  });
}

/**
 * Input sanitization middleware
 */
export const inputSanitizer = (req: Request, res: Response, next: NextFunction): void => {
  try {
    sanitizeBody(req.body);
    sanitizeObject(req.query, sanitizeString);
    sanitizeObject(req.params, sanitizeString);
    next();
  } catch (error) {
    logger.error('Input sanitization error:', error);
    next(); // Continue on error to avoid blocking requests
  }
};

/**
 * Specific sanitizer for registration data
 */
export const registrationSanitizer = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (req.body) {
      // Ensure required fields are present
      const requiredFields = ['email', 'full_name', 'password', 'confirm_password'];
      const missingFields = requiredFields.filter(field => !req.body[field]);

      if (missingFields.length > 0) {
        res.status(400).json({
          error: 'Missing required fields',
          missingFields,
        });
        return;
      }

      // Sanitize registration-specific fields
      req.body.email = sanitizeEmail(req.body.email);
      req.body.full_name = sanitizeString(req.body.full_name);
      req.body.phone = req.body.phone ? sanitizePhone(req.body.phone) : undefined;
      req.body.whatsapp_number = req.body.whatsapp_number
        ? sanitizeWhatsApp(req.body.whatsapp_number)
        : undefined;
      req.body.password = req.body.password.trim();
      req.body.confirm_password = req.body.confirm_password.trim();
    }

    next();
  } catch (error) {
    logger.error('Registration sanitization error:', error);
    next();
  }
};

/**
 * Specific sanitizer for login data
 */
export const loginSanitizer = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (req.body) {
      // Ensure required fields are present
      const requiredFields = ['email', 'password'];
      const missingFields = requiredFields.filter(field => !req.body[field]);

      if (missingFields.length > 0) {
        res.status(400).json({
          error: 'Missing required fields',
          missingFields,
        });
        return;
      }

      // Sanitize login-specific fields
      req.body.email = sanitizeEmail(req.body.email);
      req.body.password = req.body.password.trim();

      // Handle remember_me field
      if (req.body.remember_me !== undefined) {
        req.body.remember_me = Boolean(req.body.remember_me);
      }
    }

    next();
  } catch (error) {
    logger.error('Login sanitization error:', error);
    next();
  }
};
