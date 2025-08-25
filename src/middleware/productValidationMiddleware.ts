import { Request, Response, NextFunction } from 'express';
import { ProductValidator } from '@/validators/productValidator';

export function productValidationMiddleware(action: 'create' | 'update') {
  return (req: Request, res: Response, next: NextFunction): void => {
    let result;
    if (action === 'create') {
      result = ProductValidator.validateCreate(req.body);
    } else {
      result = ProductValidator.validateUpdate(req.body);
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
