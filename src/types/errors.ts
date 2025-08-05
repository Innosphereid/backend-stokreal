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
  // Authentication errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  UNAUTHORIZED = 'UNAUTHORIZED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // User management errors
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  PASSWORD_MISMATCH = 'PASSWORD_MISMATCH',
  WEAK_PASSWORD = 'WEAK_PASSWORD',

  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Resource errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',

  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',

  // Email errors
  EMAIL_SEND_FAILED = 'EMAIL_SEND_FAILED',
  EMAIL_INVALID = 'EMAIL_INVALID',

  // Server errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  BAD_REQUEST = 'BAD_REQUEST',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED',
  REQUEST_TIMEOUT = 'REQUEST_TIMEOUT',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
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
