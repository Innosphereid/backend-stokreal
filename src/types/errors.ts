export interface ApiErrorResponse {
  success: false;
  message: string;
  error?: {
    code: string;
    details?: string;
    fields?: Array<{
      field: string;
      message: string;
    }>;
  };
  timestamp: string;
}

export interface ValidationErrorResponse {
  success: false;
  message: string;
  errors: Array<{
    field: string;
    message: string;
  }>;
  timestamp: string;
}

export enum ErrorCodes {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',

  // Resource Management
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',

  // User Management
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',

  // Server Errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

  // Token Errors
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  TOKEN_MISSING = 'TOKEN_MISSING',
}

export interface CustomError extends Error {
  statusCode: number;
  errorCode: ErrorCodes;
  isOperational: boolean;
  details?: string;
  fields?: Array<{
    field: string;
    message: string;
  }>;
}
