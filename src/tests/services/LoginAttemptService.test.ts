import { LoginAttemptService } from '../../services/LoginAttemptService';
import { db } from '../../config/database';

// Mock the database
jest.mock('../../config/database', () => ({
  db: jest.fn(),
}));

// Mock the logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('LoginAttemptService', () => {
  let service: LoginAttemptService;
  let mockDb: jest.Mocked<any>;

  beforeEach(() => {
    service = new LoginAttemptService();
    mockDb = db as jest.Mocked<any>;
    jest.clearAllMocks();
  });

  describe('recordAttempt', () => {
    it('should record a successful login attempt with valid email', async () => {
      const mockInsert = jest.fn().mockResolvedValue([1]);
      mockDb.mockReturnValue({
        insert: mockInsert,
      });

      const data = {
        userId: 'user123',
        email: 'test@example.com',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        success: true,
      };

      await service.recordAttempt(data);

      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'user123',
        email: 'test@example.com',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        success: true,
        failure_reason: undefined,
        created_at: expect.any(Date),
      });
    });

    it('should record a failed login attempt with valid email', async () => {
      const mockInsert = jest.fn().mockResolvedValue([1]);
      mockDb.mockReturnValue({
        insert: mockInsert,
      });

      const data = {
        email: 'test@example.com',
        ipAddress: '192.168.1.1',
        success: false,
        failureReason: 'Invalid password',
      };

      await service.recordAttempt(data);

      expect(mockInsert).toHaveBeenCalledWith({
        user_id: undefined,
        email: 'test@example.com',
        ip_address: '192.168.1.1',
        user_agent: undefined,
        success: false,
        failure_reason: 'Invalid password',
        created_at: expect.any(Date),
      });
    });

    it('should convert email to lowercase', async () => {
      const mockInsert = jest.fn().mockResolvedValue([1]);
      mockDb.mockReturnValue({
        insert: mockInsert,
      });

      const data = {
        email: 'TEST@EXAMPLE.COM',
        ipAddress: '192.168.1.1',
        success: true,
      };

      await service.recordAttempt(data);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
        })
      );
    });

    it('should handle database errors gracefully', async () => {
      const mockInsert = jest.fn().mockRejectedValue(new Error('Database error'));
      mockDb.mockReturnValue({
        insert: mockInsert,
      });

      const data = {
        email: 'test@example.com',
        ipAddress: '192.168.1.1',
        success: true,
      };

      // Should not throw error
      await expect(service.recordAttempt(data)).resolves.not.toThrow();
    });

    // Email validation tests - the main focus
    describe('email validation', () => {
      it('should accept valid email formats', async () => {
        const mockInsert = jest.fn().mockResolvedValue([1]);
        mockDb.mockReturnValue({
          insert: mockInsert,
        });

        const validEmails = [
          'user@example.com',
          'user.name@example.com',
          'user+tag@example.com',
          'user@subdomain.example.com',
          'user@example.co.uk',
          'user123@example.com',
        ];

        for (const email of validEmails) {
          await service.recordAttempt({
            email,
            ipAddress: '192.168.1.1',
            success: true,
          });

          expect(mockInsert).toHaveBeenCalledWith(
            expect.objectContaining({
              email: email.toLowerCase(),
            })
          );
        }
      });

      it('should reject single invalid email format', async () => {
        const mockInsert = jest.fn().mockResolvedValue([1]);
        mockDb.mockReturnValue({
          insert: mockInsert,
        });

        await service.recordAttempt({
          email: 'invalid-email',
          ipAddress: '192.168.1.1',
          success: true,
        });

        // Should not call insert for invalid email
        expect(mockInsert).not.toHaveBeenCalled();
      });

      it('should reject emails that are too long', async () => {
        const mockInsert = jest.fn().mockResolvedValue([1]);
        mockDb.mockReturnValue({
          insert: mockInsert,
        });

        const longEmail = 'a'.repeat(250) + '@example.com';

        await service.recordAttempt({
          email: longEmail,
          ipAddress: '192.168.1.1',
          success: true,
        });

        // Should not call insert for emails that are too long
        expect(mockInsert).not.toHaveBeenCalled();
      });

      it('should reject non-string email values', async () => {
        const invalidEmailValues = [null, undefined, 123, {}, []];

        for (const email of invalidEmailValues) {
          const mockInsert = jest.fn().mockResolvedValue([1]);
          mockDb.mockReturnValue({
            insert: mockInsert,
          });

          await service.recordAttempt({
            email: email as any,
            ipAddress: '192.168.1.1',
            success: true,
          });

          // Should not call insert for non-string email values
          expect(mockInsert).not.toHaveBeenCalled();
        }
      });
    });
  });
});
