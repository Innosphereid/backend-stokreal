import request from 'supertest';
import { app } from '../../index';

describe('Performance Tests', () => {
  const baseUrl = '/api/v1/auth';
  const maxResponseTime = 500; // 500ms as specified in requirements

  describe('Response Time Tests', () => {
    it('should respond to health check within 500ms', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(maxResponseTime);
      expect(response.body).toHaveProperty('status', 'ok');
    });

    it('should handle registration requests within 500ms', async () => {
      const registrationData = {
        email: 'perf-test@example.com',
        password: 'Password123!',
        full_name: 'Performance Test User',
        phone: '+628123456789',
        whatsapp_number: '+628123456789',
      };

      const startTime = Date.now();
      
      const response = await request(app)
        .post(`${baseUrl}/register`)
        .send(registrationData);

      const responseTime = Date.now() - startTime;
      
      // Should respond within 500ms regardless of success/failure
      expect(responseTime).toBeLessThan(maxResponseTime);
    });

    it('should handle login requests within 500ms', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const startTime = Date.now();
      
      const response = await request(app)
        .post(`${baseUrl}/login`)
        .send(loginData);

      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(maxResponseTime);
    });

    it('should handle email verification requests within 500ms', async () => {
      const verificationData = {
        token: 'test-verification-token',
      };

      const startTime = Date.now();
      
      const response = await request(app)
        .post(`${baseUrl}/verify-email`)
        .send(verificationData);

      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(maxResponseTime);
    });

    it('should handle password reset requests within 500ms', async () => {
      const resetData = {
        email: 'test@example.com',
      };

      const startTime = Date.now();
      
      const response = await request(app)
        .post(`${baseUrl}/forgot-password`)
        .send(resetData);

      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(maxResponseTime);
    });

    it('should handle token refresh requests within 500ms', async () => {
      const refreshData = {
        refreshToken: 'test-refresh-token',
      };

      const startTime = Date.now();
      
      const response = await request(app)
        .post(`${baseUrl}/refresh`)
        .send(refreshData);

      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(maxResponseTime);
    });
  });

  describe('Load Tests', () => {
    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 10;
      const promises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          request(app)
            .get('/api/v1/health')
            .expect(200)
        );
      }

      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // All requests should complete within reasonable time
      expect(totalTime).toBeLessThan(maxResponseTime * concurrentRequests);
      
      // All responses should be successful
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should handle rapid successive requests', async () => {
      const requestCount = 20;
      const requests = [];

      for (let i = 0; i < requestCount; i++) {
        requests.push(
          request(app)
            .get('/api/v1/health')
            .expect(200)
        );
      }

      const startTime = Date.now();
      
      for (const req of requests) {
        await req;
      }

      const totalTime = Date.now() - startTime;
      const averageTime = totalTime / requestCount;

      // Average response time should be well under 500ms
      expect(averageTime).toBeLessThan(maxResponseTime / 2);
    });
  });

  describe('Database Performance', () => {
    it('should handle database queries efficiently', async () => {
      // Test user retrieval performance
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/v1/users')
        .query({ page: 1, limit: 10 });

      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(maxResponseTime);
    });

    it('should handle pagination efficiently', async () => {
      const pageSizes = [10, 25, 50, 100];
      
      for (const limit of pageSizes) {
        const startTime = Date.now();
        
        const response = await request(app)
          .get('/api/v1/users')
          .query({ page: 1, limit });

        const responseTime = Date.now() - startTime;
        
        expect(responseTime).toBeLessThan(maxResponseTime);
        expect(response.body).toHaveProperty('meta');
        expect(response.body.meta.limit).toBe(limit);
      }
    });
  });

  describe('Memory Usage', () => {
    it('should not have memory leaks during repeated requests', async () => {
      const initialMemory = process.memoryUsage();
      
      // Make multiple requests
      for (let i = 0; i < 100; i++) {
        await request(app)
          .get('/api/v1/health')
          .expect(200);
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle validation errors quickly', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123',
        full_name: '',
      };

      const startTime = Date.now();
      
      const response = await request(app)
        .post(`${baseUrl}/register`)
        .send(invalidData)
        .expect(400);

      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(maxResponseTime);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle authentication errors quickly', async () => {
      const invalidCredentials = {
        email: 'nonexistent@example.com',
        password: 'wrong-password',
      };

      const startTime = Date.now();
      
      const response = await request(app)
        .post(`${baseUrl}/login`)
        .send(invalidCredentials)
        .expect(401);

      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(maxResponseTime);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Rate Limiting Performance', () => {
    it('should handle rate limiting efficiently', async () => {
      const requests = [];
      
      // Make requests that might trigger rate limiting
      for (let i = 0; i < 15; i++) {
        requests.push(
          request(app)
            .post(`${baseUrl}/login`)
            .send({
              email: 'test@example.com',
              password: 'wrong-password',
            })
        );
      }

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      // Rate limiting should not significantly slow down responses
      expect(totalTime).toBeLessThan(maxResponseTime * 5);
      
      // Some requests should be rate limited (429)
      const rateLimitedCount = responses.filter(r => r.status === 429).length;
      expect(rateLimitedCount).toBeGreaterThan(0);
    });
  });
}); 