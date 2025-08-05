import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';

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
 * Input sanitization middleware
 */
export const inputSanitizer = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Sanitize body
    if (req.body) {
      // Sanitize common fields
      if (req.body.email) {
        req.body.email = sanitizeEmail(req.body.email);
      }

      if (req.body.full_name) {
        req.body.full_name = sanitizeString(req.body.full_name);
      }

      if (req.body.phone) {
        req.body.phone = sanitizePhone(req.body.phone);
      }

      if (req.body.whatsapp_number) {
        req.body.whatsapp_number = sanitizeWhatsApp(req.body.whatsapp_number);
      }

      // Sanitize password (only trim, don't modify content)
      if (req.body.password) {
        req.body.password = req.body.password.trim();
      }

      if (req.body.confirm_password) {
        req.body.confirm_password = req.body.confirm_password.trim();
      }

      // Sanitize other string fields
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string' && !['password', 'confirm_password'].includes(key)) {
          req.body[key] = sanitizeString(req.body[key]);
        }
      });
    }

    // Sanitize query parameters
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        if (typeof req.query[key] === 'string') {
          req.query[key] = sanitizeString(req.query[key] as string);
        }
      });
    }

    // Sanitize URL parameters
    if (req.params) {
      Object.keys(req.params).forEach(key => {
        if (typeof req.params[key] === 'string') {
          req.params[key] = sanitizeString(req.params[key]);
        }
      });
    }

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
