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
  private readonly backgroundQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue = false;
  private backgroundProcessorHandle: NodeJS.Timeout | null = null;
  private isRunning = false;

  // Singleton instance
  private static instance: AuditLogService | null = null;

  constructor() {
    // Don't start background processor automatically
    // Use start() method to explicitly start the service
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): AuditLogService {
    if (!AuditLogService.instance) {
      AuditLogService.instance = new AuditLogService();
    }
    return AuditLogService.instance;
  }

  /**
   * Start the global audit log service background processor
   */
  public static startService(): void {
    const instance = AuditLogService.getInstance();
    instance.start();
  }

  /**
   * Stop the global audit log service background processor
   */
  public static stopService(): void {
    if (AuditLogService.instance) {
      AuditLogService.instance.stop();
    }
  }

  /**
   * Check if the global service is currently running
   */
  public static isServiceRunning(): boolean {
    return AuditLogService.instance?.isServiceRunning() ?? false;
  }

  /**
   * Start the audit log service background processor
   */
  public start(): void {
    if (this.isRunning) {
      logger.warn('AuditLogService background processor is already running');
      return;
    }

    this.isRunning = true;
    this.startBackgroundProcessor();
    logger.info('AuditLogService background processor started');
  }

  /**
   * Stop the audit log service background processor
   */
  public stop(): void {
    if (!this.isRunning) {
      logger.warn('AuditLogService background processor is not running');
      return;
    }

    this.isRunning = false;
    this.stopBackgroundProcessor();
    logger.info('AuditLogService background processor stopped');
  }

  /**
   * Check if the service is currently running
   */
  public isServiceRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Start background processor for non-critical audit logs
   */
  private startBackgroundProcessor(): void {
    if (this.backgroundProcessorHandle) {
      clearInterval(this.backgroundProcessorHandle);
    }

    // Process queue every 100ms to ensure logs are written promptly
    this.backgroundProcessorHandle = setInterval(() => {
      if (this.isRunning) {
        this.processBackgroundQueue();
      }
    }, 100);
  }

  /**
   * Stop background processor
   */
  private stopBackgroundProcessor(): void {
    if (this.backgroundProcessorHandle) {
      clearInterval(this.backgroundProcessorHandle);
      this.backgroundProcessorHandle = null;
    }
  }

  /**
   * Process background queue
   */
  private async processBackgroundQueue(): Promise<void> {
    if (this.isProcessingQueue || this.backgroundQueue.length === 0 || !this.isRunning) {
      return;
    }

    this.isProcessingQueue = true;
    try {
      // Process up to 10 logs at a time to avoid blocking
      const batchSize = Math.min(10, this.backgroundQueue.length);
      const batch = this.backgroundQueue.splice(0, batchSize);

      await Promise.allSettled(
        batch.map(async logFn => {
          try {
            await logFn();
          } catch (error) {
            logger.error('Background audit log failed:', error);
          }
        })
      );
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Critical audit logging - writes synchronously to guarantee persistence
   * Use this for operations that MUST have audit trails (create, update, delete)
   */
  async logCritical(data: {
    userId?: string;
    action: string;
    resource: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    success?: boolean;
  }): Promise<void> {
    try {
      const logEntry: AuditLogEntry = {
        user_id: data.userId,
        action: data.action,
        resource: data.resource,
        details: data.details || {},
        ip_address: data.ipAddress,
        user_agent: data.userAgent,
        success: data.success !== undefined ? data.success : true,
      };

      await this.createLogEntry(logEntry);
      logger.info(
        `Critical audit log: ${data.action} for user ${data.userId || 'unknown'} on resource ${data.resource}`
      );
    } catch (error) {
      logger.error('Failed to create critical audit log entry:', error);
      // For critical logs, we might want to retry or alert
      // But don't throw to avoid breaking the main flow
    }
  }

  /**
   * Non-critical audit logging - uses reliable background processing
   * Use this for operations where audit logs are nice-to-have (listings, searches)
   */
  logNonCritical(data: {
    userId?: string;
    action: string;
    resource: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    success?: boolean;
  }): void {
    const logFn = async () => {
      try {
        const logEntry: AuditLogEntry = {
          user_id: data.userId,
          action: data.action,
          resource: data.resource,
          details: data.details || {},
          ip_address: data.ipAddress,
          user_agent: data.userAgent,
          success: data.success !== undefined ? data.success : true,
        };

        await this.createLogEntry(logEntry);
        logger.debug(
          `Non-critical audit log: ${data.action} for user ${data.userId || 'unknown'} on resource ${data.resource}`
        );
      } catch (error) {
        logger.error('Failed to create non-critical audit log entry:', error);
      }
    };

    // Add to background queue for reliable processing
    this.backgroundQueue.push(logFn);
  }

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
   * Generic log method for tier-related events
   */
  async log(data: {
    userId?: string;
    action: string;
    resource: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    success?: boolean;
  }): Promise<void> {
    try {
      const logEntry: AuditLogEntry = {
        user_id: data.userId,
        action: data.action,
        resource: data.resource,
        details: data.details || {},
        ip_address: data.ipAddress,
        user_agent: data.userAgent,
        success: data.success !== undefined ? data.success : true,
      };

      await this.createLogEntry(logEntry);
      logger.info(
        `Audit log: ${data.action} for user ${data.userId || 'unknown'} on resource ${data.resource}`
      );
    } catch (error) {
      logger.error('Failed to create audit log entry:', error);
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
