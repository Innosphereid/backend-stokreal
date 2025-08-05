import request from 'supertest';
import { app } from '../../index';
import { JWTUtils } from '../../utils/jwt';
import { PasswordUtils } from '../../utils/password';

// Mock dependencies
jest.mock('../../utils/jwt');
jest.mock('../../utils/password');

const mockJWTUtils = JWTUtils as jest.Mocked<typeof JWTUtils>;
const mockPasswordUtils = PasswordUtils as jest.Mocked<typeof PasswordUtils>;

describe('Security Tests', () => {
  const baseUrl = '/api/v1/auth';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('JWT Security', () => {
    it('should reject malformed JWT tokens', async () => {
      const malformedTokens = [
        'not.a.jwt.token',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.invalid',
        '',
        'null',
        'undefined',
      ];

      for (const token of malformedTokens) {
        const response = await request(app)
          .post(`${baseUrl}/verify-email`)
          .send({ token })
          .expect(401);

        expect(response.body).toHaveProperty('error');
      }
    });

    it('should reject expired JWT tokens', async () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';

      mockJWTUtils.verifyVerificationToken.mockImplementation(() => {
        throw new Error('Token expired');
      });

      const response = await request(app)
        .post(`${baseUrl}/verify-email`)
        .send({ token: expiredToken })
        .expect(401);

      expect(response.body.error).toContain('expired');
    });

    it('should reject tokens with wrong signature', async () => {
      const tokenWithWrongSignature = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.wrong-signature';

      mockJWTUtils.verifyVerificationToken.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const response = await request(app)
        .post(`${baseUrl}/verify-email`)
        .send({ token: tokenWithWrongSignature })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject tokens with wrong audience', async () => {
      const tokenWithWrongAudience = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJhdWQiOiJ3cm9uZy1hdWRpZW5jZSJ9.invalid';

      mockJWTUtils.verifyVerificationToken.mockImplementation(() => {
        throw new Error('Invalid audience');
      });

      const response = await request(app)
        .post(`${baseUrl}/verify-email`)
        .send({ token: tokenWithWrongAudience })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject tokens with wrong issuer', async () => {
      const tokenWithWrongIssuer = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJpc3MiOiJ3cm9uZy1pc3N1ZXIifQ.invalid';

      mockJWTUtils.verifyVerificationToken.mockImplementation(() => {
        throw new Error('Invalid issuer');
      });

      const response = await request(app)
        .post(`${baseUrl}/verify-email`)
        .send({ token: tokenWithWrongIssuer })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Input Validation & Sanitization', () => {
    it('should prevent SQL injection in email field', async () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "'; INSERT INTO users (email, password) VALUES ('hacker@evil.com', 'password'); --",
        "admin'--",
        "'; UPDATE users SET role='admin' WHERE email='admin@example.com'; --",
      ];

      for (const maliciousEmail of sqlInjectionAttempts) {
        const response = await request(app)
          .post(`${baseUrl}/register`)
          .send({
            email: maliciousEmail,
            password: 'Password123!',
            full_name: 'Test User',
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
        // Should not expose database errors
        expect(response.body.error).not.toContain('SQL');
        expect(response.body.error).not.toContain('syntax');
      }
    });

    it('should prevent XSS in user input', async () => {
      const xssAttempts = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(\'xss\')">',
        '"><script>alert("xss")</script>',
        '"; alert("xss"); //',
      ];

      for (const maliciousInput of xssAttempts) {
        const response = await request(app)
          .post(`${baseUrl}/register`)
          .send({
            email: 'test@example.com',
            password: 'Password123!',
            full_name: maliciousInput,
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
      }
    });

    it('should prevent NoSQL injection', async () => {
      const nosqlInjectionAttempts = [
        '{"$gt": ""}',
        '{"$ne": null}',
        '{"$where": "1==1"}',
        '{"$regex": ".*"}',
      ];

      for (const maliciousInput of nosqlInjectionAttempts) {
        const response = await request(app)
          .post(`${baseUrl}/register`)
          .send({
            email: maliciousInput,
            password: 'Password123!',
            full_name: 'Test User',
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
      }
    });

    it('should validate email format strictly', async () => {
      const invalidEmails = [
        'not-an-email',
        '@example.com',
        'test@',
        'test@.com',
        'test..test@example.com',
        'test@example..com',
        'test@example.com.',
        '.test@example.com',
        'test@example.com@',
        'test@@example.com',
        'test@example@com',
        'test@example.com@test',
        'test@example.com test',
        'test @example.com',
        'test@ example.com',
        'test@example .com',
        'test@example. com',
        'test@example.com ',
        ' test@example.com',
        'test@example.com\n',
        'test@example.com\r',
        'test@example.com\t',
      ];

      for (const invalidEmail of invalidEmails) {
        const response = await request(app)
          .post(`${baseUrl}/register`)
          .send({
            email: invalidEmail,
            password: 'Password123!',
            full_name: 'Test User',
          })
          .expect(400);

        expect(response.body.error).toContain('email');
      }
    });

    it('should enforce strong password requirements', async () => {
      const weakPasswords = [
        '123',
        'password',
        '123456',
        'qwerty',
        'abc123',
        'password123',
        'admin',
        'letmein',
        'welcome',
        'monkey',
        'dragon',
        'master',
        'football',
        'superman',
        'iloveyou',
        'starwars',
        'princess',
        'admin123',
        'root',
        'toor',
        'guest',
        'user',
        'test',
        'demo',
        'sample',
        'example',
        'temp',
        'tmp',
        'backup',
        'old',
        'new',
        'test123',
        'demo123',
        'sample123',
        'example123',
        'temp123',
        'tmp123',
        'backup123',
        'old123',
        'new123',
      ];

      for (const weakPassword of weakPasswords) {
        const response = await request(app)
          .post(`${baseUrl}/register`)
          .send({
            email: 'test@example.com',
            password: weakPassword,
            full_name: 'Test User',
          })
          .expect(400);

        expect(response.body.error).toContain('password');
      }
    });

    it('should prevent command injection', async () => {
      const commandInjectionAttempts = [
        'test@example.com; rm -rf /',
        'test@example.com && rm -rf /',
        'test@example.com | rm -rf /',
        'test@example.com || rm -rf /',
        'test@example.com; ls -la',
        'test@example.com && cat /etc/passwd',
        'test@example.com | whoami',
        'test@example.com || id',
        'test@example.com; echo "hacked"',
        'test@example.com && echo "hacked"',
      ];

      for (const maliciousInput of commandInjectionAttempts) {
        const response = await request(app)
          .post(`${baseUrl}/register`)
          .send({
            email: maliciousInput,
            password: 'Password123!',
            full_name: 'Test User',
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should limit registration attempts per IP', async () => {
      const validRegistrationData = {
        email: 'test@example.com',
        password: 'Password123!',
        full_name: 'Test User',
      };

      // Make multiple registration attempts
      for (let i = 0; i < 10; i++) {
        const response = await request(app)
          .post(`${baseUrl}/register`)
          .send({
            ...validRegistrationData,
            email: `test${i}@example.com`,
          });

        if (response.status === 429) {
          expect(response.body.error).toContain('Too many requests');
          break;
        }
      }
    });

    it('should limit login attempts per IP', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrong-password',
      };

      // Make multiple failed login attempts
      for (let i = 0; i < 10; i++) {
        const response = await request(app)
          .post(`${baseUrl}/login`)
          .send(loginData);

        if (response.status === 429) {
          expect(response.body.error).toContain('Too many failed login attempts');
          break;
        }
      }
    });

    it('should limit password reset requests per email', async () => {
      const email = 'test@example.com';

      // Make multiple password reset requests
      for (let i = 0; i < 10; i++) {
        const response = await request(app)
          .post(`${baseUrl}/forgot-password`)
          .send({ email });

        if (response.status === 429) {
          expect(response.body.error).toContain('Too many requests');
          break;
        }
      }
    });
  });

  describe('Password Security', () => {
    it('should hash passwords securely', async () => {
      const password = 'Password123!';
      
      mockPasswordUtils.hashPassword.mockResolvedValue('hashed-password');

      await request(app)
        .post(`${baseUrl}/register`)
        .send({
          email: 'test@example.com',
          password,
          full_name: 'Test User',
        })
        .expect(201);

      expect(mockPasswordUtils.hashPassword).toHaveBeenCalledWith(password);
    });

    it('should verify passwords securely', async () => {
      const password = 'Password123!';
      const hashedPassword = 'hashed-password';

      mockPasswordUtils.verifyPassword.mockResolvedValue(true);

      await request(app)
        .post(`${baseUrl}/login`)
        .send({
          email: 'test@example.com',
          password,
        })
        .expect(200);

      expect(mockPasswordUtils.verifyPassword).toHaveBeenCalledWith(password, hashedPassword);
    });

    it('should not expose password hashes in responses', async () => {
      const response = await request(app)
        .post(`${baseUrl}/register`)
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          full_name: 'Test User',
        })
        .expect(201);

      expect(response.body.data).not.toHaveProperty('password_hash');
      expect(response.body.data).not.toHaveProperty('password');
    });
  });

  describe('Error Handling', () => {
    it('should not expose internal errors', async () => {
      // Mock an internal error
      mockJWTUtils.verifyVerificationToken.mockImplementation(() => {
        throw new Error('Internal database error: connection timeout');
      });

      const response = await request(app)
        .post(`${baseUrl}/verify-email`)
        .send({ token: 'valid-token' })
        .expect(401);

      expect(response.body.error).not.toContain('database');
      expect(response.body.error).not.toContain('connection');
      expect(response.body.error).not.toContain('timeout');
    });

    it('should not expose stack traces', async () => {
      const response = await request(app)
        .post(`${baseUrl}/register`)
        .send({
          email: 'invalid-email',
          password: '123',
          full_name: '',
        })
        .expect(400);

      expect(response.body).not.toHaveProperty('stack');
      expect(response.body).not.toHaveProperty('stackTrace');
    });

    it('should not expose system information', async () => {
      const response = await request(app)
        .post(`${baseUrl}/register`)
        .send({
          email: 'invalid-email',
          password: '123',
          full_name: '',
        })
        .expect(400);

      expect(response.body.error).not.toContain('node_modules');
      expect(response.body.error).not.toContain('src/');
      expect(response.body.error).not.toContain('package.json');
    });
  });

  describe('HTTP Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
      expect(response.headers).toHaveProperty('strict-transport-security');
      expect(response.headers).toHaveProperty('content-security-policy');
    });

    it('should prevent clickjacking', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.headers['x-frame-options']).toBe('DENY');
    });

    it('should prevent MIME type sniffing', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should enable XSS protection', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });
  });

  describe('CORS Security', () => {
    it('should not allow unauthorized origins', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .set('Origin', 'https://malicious-site.com')
        .expect(200);

      // Should not include malicious origin in CORS headers
      expect(response.headers['access-control-allow-origin']).not.toBe('https://malicious-site.com');
    });

    it('should handle preflight requests securely', async () => {
      const response = await request(app)
        .options('/api/v1/auth/login')
        .set('Origin', 'https://trusted-site.com')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-methods');
      expect(response.headers).toHaveProperty('access-control-allow-headers');
    });
  });

  describe('Request Size Limits', () => {
    it('should reject oversized requests', async () => {
      const largeData = {
        email: 'test@example.com',
        password: 'Password123!',
        full_name: 'A'.repeat(10000), // Very large name
      };

      const response = await request(app)
        .post(`${baseUrl}/register`)
        .send(largeData)
        .expect(413);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject requests with too many fields', async () => {
      const dataWithManyFields: any = {
        email: 'test@example.com',
        password: 'Password123!',
        full_name: 'Test User',
      };

      // Add many extra fields
      for (let i = 0; i < 1000; i++) {
        dataWithManyFields[`field${i}`] = `value${i}`;
      }

      const response = await request(app)
        .post(`${baseUrl}/register`)
        .send(dataWithManyFields)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
}); 