import { db } from '@/config/database';
import { logger } from '@/utils/logger';

export interface LoginAttempt {
  id: string;
  user_id?: string;
  email: string;
  ip_address: string;
  user_agent?: string;
  success: boolean;
  failure_reason?: string;
  created_at: Date;
}

export interface LoginAttemptStats {
  totalAttempts: number;
  failedAttempts: number;
  lastAttemptTime: Date;
  isBlocked: boolean;
  remainingAttempts: number;
}

export class LoginAttemptService {
  private readonly tableName = 'user_login_attempts';

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    if (!email || typeof email !== 'string') {
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 255;
  }

  /**
   * Record a login attempt
   */
  async recordAttempt(data: {
    userId?: string;
    email: string;
    ipAddress: string;
    userAgent?: string;
    success: boolean;
    failureReason?: string;
  }): Promise<void> {
    try {
      // Validate email format before storing
      if (!this.isValidEmail(data.email)) {
        logger.warn(`Invalid email format rejected: ${data.email}`, {
          ipAddress: data.ipAddress,
          success: data.success,
        });
        return; // Don't store invalid emails
      }

      await db(this.tableName).insert({
        user_id: data.userId,
        email: data.email.toLowerCase(),
        ip_address: data.ipAddress,
        user_agent: data.userAgent,
        success: data.success,
        failure_reason: data.failureReason,
        created_at: new Date(),
      });

      logger.info(`Login attempt recorded for ${data.email}`, {
        success: data.success,
        ipAddress: data.ipAddress,
      });
    } catch (error) {
      logger.error('Failed to record login attempt:', error);
      // Don't throw error as this shouldn't block the login process
    }
  }

  /**
   * Get login attempt statistics for an IP address
   */
  async getIpStats(ipAddress: string, windowMinutes: number = 15): Promise<LoginAttemptStats> {
    try {
      const cutoffTime = new Date(Date.now() - windowMinutes * 60 * 1000);

      const attempts = await db(this.tableName)
        .where('ip_address', ipAddress)
        .where('created_at', '>=', cutoffTime)
        .orderBy('created_at', 'desc');

      const totalAttempts = attempts.length;
      const failedAttempts = attempts.filter(a => !a.success).length;
      const lastAttemptTime = attempts.length > 0 ? attempts[0].created_at : new Date(0);

      // Check if IP is blocked (5 failed attempts in 15 minutes)
      const isBlocked = failedAttempts >= 5;
      const remainingAttempts = Math.max(0, 5 - failedAttempts);

      return {
        totalAttempts,
        failedAttempts,
        lastAttemptTime,
        isBlocked,
        remainingAttempts,
      };
    } catch (error) {
      logger.error('Failed to get IP stats:', error);
      return {
        totalAttempts: 0,
        failedAttempts: 0,
        lastAttemptTime: new Date(0),
        isBlocked: false,
        remainingAttempts: 5,
      };
    }
  }

  /**
   * Get login attempt statistics for an email address
   */
  async getEmailStats(email: string, windowMinutes: number = 15): Promise<LoginAttemptStats> {
    try {
      const cutoffTime = new Date(Date.now() - windowMinutes * 60 * 1000);

      const attempts = await db(this.tableName)
        .where('email', email.toLowerCase())
        .where('created_at', '>=', cutoffTime)
        .orderBy('created_at', 'desc');

      const totalAttempts = attempts.length;
      const failedAttempts = attempts.filter(a => !a.success).length;
      const lastAttemptTime = attempts.length > 0 ? attempts[0].created_at : new Date(0);

      // Check if email is blocked (3 failed attempts in 15 minutes)
      const isBlocked = failedAttempts >= 3;
      const remainingAttempts = Math.max(0, 3 - failedAttempts);

      return {
        totalAttempts,
        failedAttempts,
        lastAttemptTime,
        isBlocked,
        remainingAttempts,
      };
    } catch (error) {
      logger.error('Failed to get email stats:', error);
      return {
        totalAttempts: 0,
        failedAttempts: 0,
        lastAttemptTime: new Date(0),
        isBlocked: false,
        remainingAttempts: 3,
      };
    }
  }

  /**
   * Check if login should be blocked for IP address
   */
  async isIpBlocked(ipAddress: string): Promise<boolean> {
    const stats = await this.getIpStats(ipAddress);
    return stats.isBlocked;
  }

  /**
   * Check if login should be blocked for email address
   */
  async isEmailBlocked(email: string): Promise<boolean> {
    const stats = await this.getEmailStats(email);
    return stats.isBlocked;
  }

  /**
   * Clean up old login attempts (older than 24 hours)
   */
  async cleanupOldAttempts(): Promise<void> {
    try {
      const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

      const deletedCount = await db(this.tableName).where('created_at', '<', cutoffTime).del();

      if (deletedCount > 0) {
        logger.info(`Cleaned up ${deletedCount} old login attempts`);
      }
    } catch (error) {
      logger.error('Failed to cleanup old login attempts:', error);
    }
  }

  /**
   * Get recent login attempts for a user
   */
  async getUserAttempts(userId: string, limit: number = 10): Promise<LoginAttempt[]> {
    try {
      return await db(this.tableName)
        .where('user_id', userId)
        .orderBy('created_at', 'desc')
        .limit(limit);
    } catch (error) {
      logger.error('Failed to get user login attempts:', error);
      return [];
    }
  }

  /**
   * Get failed login attempts for security monitoring
   */
  async getRecentFailedAttempts(limit: number = 50): Promise<LoginAttempt[]> {
    try {
      return await db(this.tableName)
        .where('success', false)
        .orderBy('created_at', 'desc')
        .limit(limit);
    } catch (error) {
      logger.error('Failed to get recent failed attempts:', error);
      return [];
    }
  }
}
