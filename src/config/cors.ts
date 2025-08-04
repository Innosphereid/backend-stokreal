import { CorsOptions } from 'cors';

export interface CorsConfig {
  development: CorsOptions;
  staging: CorsOptions;
  production: CorsOptions;
}

// Environment detection
const environment = process.env.NODE_ENV || 'development';
const isProduction = environment === 'production';

// Parse allowed origins from environment variable
const parseOrigins = (originsString?: string): string[] | boolean => {
  if (!originsString) return false;

  if (originsString === '*') return true as unknown as string[];
  if (originsString === 'false') return false;

  return originsString.split(',').map(origin => origin.trim());
};

// Parse allowed methods from environment variable
const parseMethods = (methodsString?: string): string[] => {
  if (!methodsString) return ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'];

  return methodsString.split(',').map(method => method.trim().toUpperCase());
};

// Parse allowed headers from environment variable
const parseHeaders = (headersString?: string): string[] => {
  const defaultHeaders = [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key',
    'X-CSRF-Token',
  ];

  if (!headersString) return defaultHeaders;

  const customHeaders = headersString.split(',').map(header => header.trim());
  return [...new Set([...defaultHeaders, ...customHeaders])];
};

// CORS configuration for different environments
export const corsConfig: CorsConfig = {
  development: {
    origin: parseOrigins(process.env.CORS_ORIGIN) || [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8080',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:8080',
    ],
    methods: parseMethods(process.env.CORS_METHODS),
    allowedHeaders: parseHeaders(process.env.CORS_ALLOWED_HEADERS),
    credentials: process.env.CORS_CREDENTIALS === 'true' || true,
    optionsSuccessStatus: 200,
    preflightContinue: false,
    maxAge: parseInt(process.env.CORS_MAX_AGE || '86400', 10), // 24 hours
  },

  staging: {
    origin: parseOrigins(process.env.CORS_ORIGIN) || false,
    methods: parseMethods(process.env.CORS_METHODS),
    allowedHeaders: parseHeaders(process.env.CORS_ALLOWED_HEADERS),
    credentials: process.env.CORS_CREDENTIALS === 'true' || true,
    optionsSuccessStatus: 200,
    preflightContinue: false,
    maxAge: parseInt(process.env.CORS_MAX_AGE || '3600', 10), // 1 hour
  },

  production: {
    origin: parseOrigins(process.env.CORS_ORIGIN) || false,
    methods: parseMethods(process.env.CORS_METHODS) || ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: parseHeaders(process.env.CORS_ALLOWED_HEADERS),
    credentials: process.env.CORS_CREDENTIALS === 'true' || false,
    optionsSuccessStatus: 200,
    preflightContinue: false,
    maxAge: parseInt(process.env.CORS_MAX_AGE || '3600', 10), // 1 hour
    exposedHeaders: process.env.CORS_EXPOSED_HEADERS?.split(',').map(h => h.trim()) || [],
  },
};

// Get CORS configuration for current environment
export const getCurrentCorsConfig = (): CorsOptions => {
  const config = corsConfig[environment as keyof CorsConfig] || corsConfig.development;

  return {
    ...config,
    // Dynamic origin validation function for more complex scenarios
    origin:
      typeof config.origin === 'function'
        ? config.origin
        : (origin, callback) => {
            // Allow requests with no origin (mobile apps, Postman, etc.)
            if (!origin) {
              return callback(null, true);
            }

            const allowedOrigins = config.origin;

            // If origin is boolean true, allow all
            if (allowedOrigins === true) {
              return callback(null, true);
            }

            // If origin is boolean false, deny all
            if (allowedOrigins === false) {
              return callback(new Error('Not allowed by CORS'), false);
            }

            // If origin is array, check if current origin is allowed
            if (Array.isArray(allowedOrigins)) {
              if (allowedOrigins.includes(origin)) {
                return callback(null, true);
              } else {
                return callback(new Error(`Origin ${origin} not allowed by CORS`), false);
              }
            }

            // Default deny
            return callback(new Error('Not allowed by CORS'), false);
          },
  };
};

// CORS utilities
export class CorsUtils {
  /**
   * Check if origin is allowed
   */
  static isOriginAllowed(origin: string): boolean {
    const config = getCurrentCorsConfig();
    const allowedOrigins = config.origin;

    if (allowedOrigins === true) return true;
    if (allowedOrigins === false) return false;
    if (Array.isArray(allowedOrigins)) return allowedOrigins.includes(origin);

    return false;
  }

  /**
   * Get allowed origins for current environment
   */
  static getAllowedOrigins(): string[] | boolean {
    const config = corsConfig[environment as keyof CorsConfig] || corsConfig.development;
    return config.origin as string[] | boolean;
  }

  /**
   * Get allowed methods for current environment
   */
  static getAllowedMethods(): string[] {
    const config = corsConfig[environment as keyof CorsConfig] || corsConfig.development;
    return config.methods as string[];
  }

  /**
   * Get allowed headers for current environment
   */
  static getAllowedHeaders(): string[] {
    const config = corsConfig[environment as keyof CorsConfig] || corsConfig.development;
    return config.allowedHeaders as string[];
  }

  /**
   * Validate CORS configuration
   */
  static validateConfig(): void {
    const config = getCurrentCorsConfig();

    // Warn about insecure configurations in production
    if (isProduction) {
      if (config.origin === true) {
        console.warn(
          '⚠️  CORS origin is set to allow all origins in production. This may be insecure.'
        );
      }

      if (config.credentials === true && config.origin === true) {
        console.warn(
          '⚠️  CORS credentials are enabled with wildcard origin in production. This is insecure.'
        );
      }
    }

    // Validate methods
    const validMethods = ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'];
    const methods = config.methods as string[];

    if (methods) {
      const invalidMethods = methods.filter(method => !validMethods.includes(method));
      if (invalidMethods.length > 0) {
        console.warn(`⚠️  Invalid CORS methods detected: ${invalidMethods.join(', ')}`);
      }
    }

    // Validate max age
    if (config.maxAge && (config.maxAge < 0 || config.maxAge > 86400)) {
      console.warn('⚠️  CORS maxAge should be between 0 and 86400 seconds (24 hours)');
    }
  }

  /**
   * Get CORS configuration summary
   */
  static getConfigSummary(): {
    environment: string;
    origins: string[] | boolean;
    methods: string[];
    headers: string[];
    credentials: boolean;
    maxAge: number;
  } {
    const config = getCurrentCorsConfig();

    return {
      environment,
      origins: config.origin as string[] | boolean,
      methods: config.methods as string[],
      headers: config.allowedHeaders as string[],
      credentials: config.credentials as boolean,
      maxAge: config.maxAge as number,
    };
  }
}

// Initialize and validate configuration
CorsUtils.validateConfig();

export default getCurrentCorsConfig();
