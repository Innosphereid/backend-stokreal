import { Request, Response, NextFunction } from 'express';
import { CategoryValidator } from '@/validators/categoryValidator';

export function categoryValidationMiddleware(action: 'create' | 'update') {
  return (req: Request, res: Response, next: NextFunction): void => {
    let result;
    if (action === 'create') {
      result = CategoryValidator.validateCreate(req.body);
    } else {
      result = CategoryValidator.validateUpdate(req.body);
    }
    if (!result.isValid) {
      res.status(400).json({
        status: 400,
        message: 'Validation failed',
        errors: result.errors,
      });
      return;
    }
    // Attach sanitized data to req.body
    req.body = result.sanitizedData;
    next();
  };
}
