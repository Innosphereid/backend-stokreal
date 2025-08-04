import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import { JWTError, TokenExpiredError, TokenInvalidError, TokenMissingError } from '@/utils/jwt';
import { AppError, formatErrorResponse } from '@/utils/errors';
import { ErrorCodes } from '@/types/errors';

export interface CustomError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: CustomError | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  // Log error with full details for debugging
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Handle AppError instances (our custom errors)
  if (error instanceof AppError) {
    const errorResponse = formatErrorResponse(error);
    res.status(error.statusCode).json(errorResponse);
    return;
  }

  // Handle JWT-specific errors
  if (error instanceof TokenExpiredError) {
    const jwtError = new AppError(
      `${error.tokenType} token has expired`,
      401,
      ErrorCodes.TOKEN_EXPIRED
    );
    const errorResponse = formatErrorResponse(jwtError);
    res.status(401).json(errorResponse);
    return;
  }

  if (error instanceof TokenInvalidError) {
    const jwtError = new AppError(`Invalid token: ${error.reason}`, 401, ErrorCodes.TOKEN_INVALID);
    const errorResponse = formatErrorResponse(jwtError);
    res.status(401).json(errorResponse);
    return;
  }

  if (error instanceof TokenMissingError) {
    const jwtError = new AppError(
      `Authentication required: token not found in ${error.location}`,
      401,
      ErrorCodes.TOKEN_MISSING
    );
    const errorResponse = formatErrorResponse(jwtError);
    res.status(401).json(errorResponse);
    return;
  }

  if (error instanceof JWTError) {
    const jwtError = new AppError(error.message, error.statusCode, ErrorCodes.TOKEN_INVALID);
    const errorResponse = formatErrorResponse(jwtError);
    res.status(error.statusCode).json(errorResponse);
    return;
  }

  // Handle other known error types
  if (error.name === 'ValidationError') {
    const validationError = new AppError(
      'Validation Error',
      400,
      ErrorCodes.VALIDATION_ERROR,
      'One or more fields failed validation'
    );
    const errorResponse = formatErrorResponse(validationError);
    res.status(400).json(errorResponse);
    return;
  }

  if (error.name === 'UnauthorizedError') {
    const unauthorizedError = new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED);
    const errorResponse = formatErrorResponse(unauthorizedError);
    res.status(401).json(errorResponse);
    return;
  }

  if (error.name === 'CastError') {
    const castError = new AppError('Invalid ID format', 400, ErrorCodes.INVALID_INPUT);
    const errorResponse = formatErrorResponse(castError);
    res.status(400).json(errorResponse);
    return;
  }

  // Handle unknown errors
  const isDevelopment = process.env.NODE_ENV === 'development';
  const message = isDevelopment ? error.message : 'Something went wrong';
  const details = isDevelopment ? error.stack : undefined;

  const internalError = new AppError(message, 500, ErrorCodes.INTERNAL_SERVER_ERROR, details);
  const errorResponse = formatErrorResponse(internalError);
  res.status(500).json(errorResponse);
};

export const createError = (message: string, statusCode: number = 500): CustomError => {
  const error: CustomError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
