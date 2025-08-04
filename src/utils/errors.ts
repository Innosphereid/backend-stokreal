import { CustomError, ErrorCodes, ApiErrorResponse, ValidationErrorResponse } from '@/types/errors';

export class AppError extends Error implements CustomError {
  public readonly statusCode: number;
  public readonly errorCode: ErrorCodes;
  public readonly isOperational: boolean;
  public readonly details?: string;
  public readonly fields?: Array<{ field: string; message: string }>;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: ErrorCodes = ErrorCodes.INTERNAL_SERVER_ERROR,
    details?: string,
    fields?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    if (details) this.details = details;
    if (fields) this.fields = fields;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

export const createError = (
  message: string,
  statusCode: number = 500,
  errorCode: ErrorCodes = ErrorCodes.INTERNAL_SERVER_ERROR,
  details?: string,
  fields?: Array<{ field: string; message: string }>
): AppError => {
  return new AppError(message, statusCode, errorCode, details, fields);
};

export const createValidationError = (
  message: string = 'Validation failed',
  fields: Array<{ field: string; message: string }>
): AppError => {
  return new AppError(
    message,
    400,
    ErrorCodes.VALIDATION_ERROR,
    'One or more fields failed validation',
    fields
  );
};

export const createResourceConflictError = (
  message: string,
  errorCode: ErrorCodes = ErrorCodes.RESOURCE_ALREADY_EXISTS,
  details?: string
): AppError => {
  return new AppError(message, 409, errorCode, details);
};

export const createNotFoundError = (
  message: string = 'Resource not found',
  errorCode: ErrorCodes = ErrorCodes.RESOURCE_NOT_FOUND
): AppError => {
  return new AppError(message, 404, errorCode);
};

export const createUnauthorizedError = (
  message: string = 'Unauthorized',
  errorCode: ErrorCodes = ErrorCodes.UNAUTHORIZED
): AppError => {
  return new AppError(message, 401, errorCode);
};

export const createForbiddenError = (
  message: string = 'Forbidden',
  errorCode: ErrorCodes = ErrorCodes.FORBIDDEN
): AppError => {
  return new AppError(message, 403, errorCode);
};

export const formatErrorResponse = (error: CustomError): ApiErrorResponse => {
  const response: ApiErrorResponse = {
    success: false,
    message: error.message,
    timestamp: new Date().toISOString(),
  };

  // Add error details if available
  if (error.errorCode || error.details || error.fields) {
    response.error = {
      code: error.errorCode,
    };

    if (error.details) {
      response.error.details = error.details;
    }

    if (error.fields) {
      response.error.fields = error.fields;
    }
  }

  return response;
};

export const formatValidationErrorResponse = (
  message: string,
  errors: Array<{ field: string; message: string }>
): ValidationErrorResponse => {
  return {
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString(),
  };
};
