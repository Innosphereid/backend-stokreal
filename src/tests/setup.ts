import { config } from 'dotenv';
import path from 'path';

// Load test environment variables
config({ path: path.join(__dirname, '../../.env.test') });

// Set test environment
process.env.NODE_ENV = 'test';

// Mock console methods to reduce noise during tests
const originalConsole = { ...console };

beforeAll(() => {
  // Suppress console output during tests unless explicitly needed
  if (process.env.TEST_VERBOSE !== 'true') {
    console.log = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
    console.debug = jest.fn();
  }
});

afterAll(() => {
  // Restore original console methods
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  console.debug = originalConsole.debug;
});

// Global test timeout
jest.setTimeout(10000); // 10 seconds

// Mock environment variables for testing
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only';
process.env.JWT_ACCESS_TOKEN_EXPIRY = '15m';
process.env.JWT_REFRESH_TOKEN_EXPIRY = '7d';
process.env.JWT_VERIFICATION_TOKEN_EXPIRY = '24h';
process.env.JWT_ISSUER = 'stokreal-backend-test';
process.env.JWT_AUDIENCE = 'stokreal-users-test';
process.env.JWT_ALGORITHM = 'HS256';

// Database configuration for testing
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'stokreal_test';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'password';

// Email configuration for testing
process.env.MAIL_HOST = 'smtp.mailtrap.io';
process.env.MAIL_PORT = '2525';
process.env.MAIL_USER = 'test-user';
process.env.MAIL_PASS = 'test-password';
process.env.MAIL_FROM = 'test@example.com';
process.env.MAIL_LOG_ONLY = 'true';

// Rate limiting configuration for testing
process.env.RATE_LIMIT_WINDOW_MS = '900000'; // 15 minutes
process.env.RATE_LIMIT_MAX_REQUESTS = '5';

// Server configuration for testing
process.env.PORT = '3001';
process.env.NODE_ENV = 'test';

// CORS configuration for testing
process.env.CORS_ORIGIN = 'http://localhost:3000';

// Logging configuration for testing
process.env.LOG_LEVEL = 'error';

export {};
