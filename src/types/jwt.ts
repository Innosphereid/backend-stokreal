import { Request } from 'express';

// JWT Types
export type TokenType = 'access' | 'refresh' | 'verification';

export interface JWTPayload {
  sub: string; // User ID
  email?: string;
  role?: string;
  fullName?: string;
  isActive?: boolean;
  emailVerified?: boolean;
  type: TokenType;
  purpose?: string; // For verification tokens
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

export interface JWTUser {
  id: string;
  email?: string;
  role?: string;
  fullName?: string;
  isActive?: boolean;
  emailVerified?: boolean;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface SignTokenOptions {
  expiresIn?: string;
  audience?: string;
  issuer?: string;
  subject?: string;
}

// JWT Error Classes
export class JWTError extends Error {
  public statusCode: number = 500;
  public isOperational: boolean = true;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class TokenExpiredError extends JWTError {
  public tokenType: TokenType;

  constructor(tokenType: TokenType) {
    super(`${tokenType} token has expired`, 401);
    this.tokenType = tokenType;
  }
}

export class TokenInvalidError extends JWTError {
  public reason: string;

  constructor(reason: string) {
    super(`Invalid token: ${reason}`, 401);
    this.reason = reason;
  }
}

export class TokenMissingError extends JWTError {
  public location: string;

  constructor(location: string) {
    super(`Token not found in ${location}`, 401);
    this.location = location;
  }
}

// Authentication-related interfaces
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: AuthenticatedUser;
  tokens: TokenPair;
  message: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  tokens: TokenPair;
  message: string;
}

export interface VerificationTokenRequest {
  userId: string;
  purpose: string;
  email?: string;
}

export interface VerificationTokenResponse {
  token: string;
  expiresAt: Date;
  message: string;
}

// JWT Middleware types
export interface JWTMiddlewareOptions {
  required?: boolean;
  tokenTypes?: TokenType[];
  roles?: string[];
}

// Extended Request interface for JWT authentication
export interface AuthenticatedRequest extends Request {
  user?: JWTUser;
  token?: string;
  tokenType?: TokenType;
  authToken?: string; // For backward compatibility with existing cookie middleware
}

// JWT Cookie configuration
export interface JWTCookieOptions {
  accessTokenName: string;
  refreshTokenName: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  domain?: string;
  path: string;
}

// JWT Service interfaces
export interface AuthServiceInterface {
  login(credentials: LoginCredentials): Promise<LoginResponse>;
  logout(userId: string): Promise<void>;
  refreshTokens(refreshToken: string): Promise<RefreshTokenResponse>;
  generateVerificationToken(request: VerificationTokenRequest): Promise<VerificationTokenResponse>;
  verifyToken(token: string, purpose?: string): Promise<JWTPayload>;
}

// JWT Configuration types
export interface JWTEnvironmentConfig {
  JWT_SECRET?: string;
  JWT_ACCESS_TOKEN_EXPIRY?: string;
  JWT_REFRESH_TOKEN_EXPIRY?: string;
  JWT_VERIFICATION_TOKEN_EXPIRY?: string;
  JWT_ISSUER?: string;
  JWT_AUDIENCE?: string;
  JWT_ALGORITHM?: string;
}

// Token extraction sources
export type TokenSource = 'header' | 'cookie' | 'query' | 'body';

export interface TokenExtractionResult {
  token: string | null;
  source: TokenSource | null;
  error?: string;
}

// JWT Utility class type (for dependency injection)
export interface JWTUtilsInterface {
  signToken: (
    payload: Omit<JWTPayload, 'iat' | 'exp' | 'iss' | 'aud' | 'type'>,
    type: TokenType,
    options?: SignTokenOptions
  ) => string;
  verifyToken: (token: string, expectedType?: TokenType) => JWTPayload;
  decodeToken: (token: string) => JWTPayload | null;
  generateTokenPair: (user: JWTUser) => TokenPair;
  refreshTokens: (refreshToken: string) => TokenPair;
  generateVerificationToken: (
    userId: string,
    purpose: string,
    email?: string,
    expiresIn?: string
  ) => string;
  verifyVerificationToken: (token: string, expectedPurpose?: string) => JWTPayload;
  extractUser: (payload: JWTPayload) => JWTUser;
  isTokenExpired: (token: string) => boolean;
  getTokenExpiration: (token: string) => Date | null;
  getTimeUntilExpiration: (token: string) => number | null;
}

// Express module augmentation for JWT support
declare module 'express-serve-static-core' {
  interface Request {
    user?: JWTUser;
    token?: string;
    tokenType?: TokenType;
    jwtUtils?: JWTUtilsInterface;
  }

  interface Response {
    setJWTCookies?: (accessToken: string, refreshToken?: string) => Response;
    clearJWTCookies?: () => Response;
    setAccessTokenCookie?: (token: string) => Response;
    setRefreshTokenCookie?: (token: string) => Response;
    clearAccessTokenCookie?: () => Response;
    clearRefreshTokenCookie?: () => Response;
  }
}

// Type guards
export function isJWTError(error: unknown): error is JWTError {
  return error instanceof Error && 'statusCode' in error && 'isOperational' in error;
}

export function isTokenExpiredError(error: unknown): error is TokenExpiredError {
  return error instanceof TokenExpiredError;
}

export function isTokenInvalidError(error: unknown): error is TokenInvalidError {
  return error instanceof TokenInvalidError;
}

export function isTokenMissingError(error: unknown): error is TokenMissingError {
  return error instanceof TokenMissingError;
}

export function isAuthenticatedRequest(req: Request): req is AuthenticatedRequest {
  return 'user' in req && req.user !== undefined;
}

// Utility types for role-based access control
export type UserRole = 'admin' | 'user' | 'moderator' | 'guest';

export interface RolePermissions {
  [key: string]: string[];
}

export interface JWTAuthConfig {
  roles: UserRole[];
  permissions: RolePermissions;
  defaultRole: UserRole;
}

// API Response types for JWT endpoints
export interface JWTApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
  tokenInfo?: {
    type: TokenType;
    expiresAt?: Date;
    issuedAt?: Date;
  };
}
