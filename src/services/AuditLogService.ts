import { db } from '@/config/database';
import { logger } from '@/utils/logger';

export interface AuditLogEntry {
  id?: string;
  user_id?: string | undefined;
  action: string;
  resource: string;
  details: Record<string, any>;
  ip_address?: string | undefined;
  user_agent?: string | undefined;
  success: boolean;
  created_at?: Date;
}

export class AuditLogService {
  private readonly tableName = 'audit_logs';

  /**
   * Log an authentication event
   */
  async logAuthEvent(data: {
    userId?: string;
    action: 'login' | 'logout' | 'register' | 'password_reset' | 'email_verification';
    success: boolean;
    ipAddress?: string;
    userAgent?: string;
    details?: Record<string, any>;
  }): Promise<void> {
    try {
      const logEntry: AuditLogEntry = {
        user_id: data.userId,
        action: data.action,
        resource: 'auth',
        details: data.details || {},
        ip_address: data.ipAddress,
        user_agent: data.userAgent,
        success: data.success,
      };

      await this.createLogEntry(logEntry);
      logger.info(
        `Audit log: ${data.action} ${data.success ? 'successful' : 'failed'} for user ${data.userId || 'unknown'}`
      );
    } catch (error) {
      logger.error('Failed to create audit log entry:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Log a security event
   */
  async logSecurityEvent(data: {
    userId?: string;
    action: 'rate_limit_exceeded' | 'invalid_token' | 'suspicious_activity' | 'failed_login';
    resource: string;
    ipAddress?: string;
    userAgent?: string;
    details?: Record<string, any>;
  }): Promise<void> {
    try {
      const logEntry: AuditLogEntry = {
        user_id: data.userId,
        action: data.action,
        resource: data.resource,
        details: data.details || {},
        ip_address: data.ipAddress,
        user_agent: data.userAgent,
        success: false, // Security events are typically failures
      };

      await this.createLogEntry(logEntry);
      logger.warn(
        `Security audit log: ${data.action} for user ${data.userId || 'unknown'} from IP ${data.ipAddress || 'unknown'}`
      );
    } catch (error) {
      logger.error('Failed to create security audit log entry:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Create a log entry in the database
   */
  private async createLogEntry(entry: AuditLogEntry): Promise<void> {
    await db(this.tableName).insert({
      user_id: entry.user_id,
      action: entry.action,
      resource: entry.resource,
      details: JSON.stringify(entry.details),
      ip_address: entry.ip_address,
      user_agent: entry.user_agent,
      success: entry.success,
      created_at: new Date(),
    });
  }

  /**
   * Get audit logs for a user
   */
  async getUserAuditLogs(userId: string, limit: number = 50): Promise<AuditLogEntry[]> {
    const logs = await db(this.tableName)
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .limit(limit);

    return logs.map(log => ({
      ...log,
      details: JSON.parse(log.details),
    }));
  }

  /**
   * Get recent security events
   */
  async getRecentSecurityEvents(limit: number = 100): Promise<AuditLogEntry[]> {
    const events = await db(this.tableName)
      .whereIn('action', [
        'rate_limit_exceeded',
        'invalid_token',
        'suspicious_activity',
        'failed_login',
      ])
      .orderBy('created_at', 'desc')
      .limit(limit);

    return events.map(event => ({
      ...event,
      details: JSON.parse(event.details),
    }));
  }

  /**
   * Clean up old audit logs (older than 90 days)
   */
  async cleanupOldLogs(): Promise<void> {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    await db(this.tableName).where('created_at', '<', ninetyDaysAgo).del();

    logger.info('Cleaned up old audit logs');
  }
}
