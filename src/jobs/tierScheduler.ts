import { logger } from '@/utils/logger';
import { UserModel } from '@/models/UserModel';
import { TierService } from '@/services/TierService';
import { TierNotificationService } from '@/services/TierNotificationService';
import { AuditLogService } from '@/services/AuditLogService';

/**
 * Tier Scheduler
 * - Periodically checks for subscription expirations and performs automatic downgrades after grace period
 * - Sends expiration warnings and grace period notifications
 *
 * NOTE: This is an in-process scheduler intended for a single-instance deployment.
 * For multi-instance or clustered deployments, migrate to a distributed scheduler/queue (e.g., Bull/Redis, Agenda).
 */

let downgradeIntervalHandle: NodeJS.Timeout | null = null;
let notificationIntervalHandle: NodeJS.Timeout | null = null;
let isDowngradeJobRunning = false;
let isNotificationJobRunning = false;

const DEFAULT_DOWNGRADE_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_NOTIFICATION_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function runDowngradeJobOnce(): Promise<void> {
  if (isDowngradeJobRunning) {
    logger.warn('Downgrade job is already running; skipping concurrent execution');
    return;
  }

  isDowngradeJobRunning = true;
  const userModel = new UserModel();
  const tierService = new TierService();
  const notificationService = new TierNotificationService();
  const auditLogService = new AuditLogService();

  try {
    // Find candidate users: premium, with subscription_expires_at not null and expired + grace period ended
    // Query limited batch to avoid long transactions
    const batchSize = parseInt(process.env.TIER_DOWNGRADE_BATCH_SIZE || '200', 10);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const db = userModel.getDb();
    const table = userModel.getTableName();

    const candidates = await db(table)
      .select('*')
      .where({ subscription_plan: 'premium', is_active: true })
      .whereNotNull('subscription_expires_at')
      .andWhere('subscription_expires_at', '<', sevenDaysAgo)
      .limit(batchSize);

    if (candidates.length === 0) {
      logger.debug('Downgrade job: no candidates found');
      return;
    }

    logger.info(`Downgrade job: found ${candidates.length} candidate(s)`);

    for (const user of candidates) {
      try {
        const downgraded = await tierService.performAutomaticDowngrade(user.id);
        if (downgraded) {
          // Notify user about downgrade
          await notificationService.sendTierChangeNotification(
            user,
            'premium',
            'free',
            'expiration'
          );

          // Audit log
          await auditLogService.log({
            userId: user.id,
            action: 'tier_downgrade_automatic',
            resource: 'tier_scheduler',
            details: { previous_plan: 'premium', new_plan: 'free' },
            success: true,
          });
        }
      } catch (err) {
        logger.error(`Downgrade job: failed processing user ${user.id}:`, err);
        await auditLogService.log({
          userId: user.id,
          action: 'tier_downgrade_automatic',
          resource: 'tier_scheduler',
          details: { error: (err as Error)?.message || 'unknown' },
          success: false,
        });
      }
    }
  } catch (error) {
    logger.error('Downgrade job failed:', error);
  } finally {
    isDowngradeJobRunning = false;
  }
}

export async function runNotificationJobOnce(): Promise<void> {
  if (isNotificationJobRunning) {
    logger.warn('Notification job is already running; skipping concurrent execution');
    return;
  }

  isNotificationJobRunning = true;
  const userModel = new UserModel();
  const tierService = new TierService();
  const notificationService = new TierNotificationService();
  const auditLogService = new AuditLogService();

  try {
    const db = userModel.getDb();
    const table = userModel.getTableName();

    // 1) Send expiration warnings to premium users whose subscription expires within next 7 days
    const now = new Date();
    const inSevenDays = new Date(now);
    inSevenDays.setDate(inSevenDays.getDate() + 7);

    const warnBatchSize = parseInt(process.env.TIER_NOTIFICATION_BATCH_SIZE || '500', 10);
    const expiringSoon = await db(table)
      .select('*')
      .where({ subscription_plan: 'premium', is_active: true })
      .whereNotNull('subscription_expires_at')
      .andWhere('subscription_expires_at', '>=', now)
      .andWhere('subscription_expires_at', '<=', inSevenDays)
      .limit(warnBatchSize);

    for (const user of expiringSoon) {
      try {
        const tierStatus = await tierService.getUserTierStatus(user.id);
        const daysLeft = tierStatus.days_until_expiration ?? 0;
        await notificationService.sendExpirationWarning(user, daysLeft);
        await auditLogService.log({
          userId: user.id,
          action: 'subscription_expiration_warning',
          resource: 'tier_scheduler',
          details: { days_left: daysLeft },
          success: true,
        });
      } catch (err) {
        logger.error(`Notification job (warning): failed for user ${user.id}:`, err);
      }
    }

    // 2) Send grace period notifications to users whose subscription just expired (within last 24h)
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const justExpired = await db(table)
      .select('*')
      .where({ subscription_plan: 'premium', is_active: true })
      .whereNotNull('subscription_expires_at')
      .andWhere('subscription_expires_at', '>=', yesterday)
      .andWhere('subscription_expires_at', '<', now)
      .limit(warnBatchSize);

    for (const user of justExpired) {
      try {
        const tierStatus = await tierService.getUserTierStatus(user.id);
        if (tierStatus.grace_period_active && tierStatus.grace_period_expires_at) {
          await notificationService.sendGracePeriodNotification(
            user,
            tierStatus.grace_period_expires_at
          );
          await auditLogService.log({
            userId: user.id,
            action: 'grace_period_activated',
            resource: 'tier_scheduler',
            details: { grace_period_expires_at: tierStatus.grace_period_expires_at },
            success: true,
          });
        }
      } catch (err) {
        logger.error(`Notification job (grace): failed for user ${user.id}:`, err);
      }
    }
  } catch (error) {
    logger.error('Notification job failed:', error);
  } finally {
    isNotificationJobRunning = false;
  }
}

export function startTierScheduler(): void {
  if (process.env.ENABLE_TIER_SCHEDULER === 'false') {
    logger.info('Tier scheduler disabled via ENABLE_TIER_SCHEDULER=false');
    return;
  }

  const downgradeIntervalMs = parseInt(
    process.env.TIER_DOWNGRADE_INTERVAL_MS || `${DEFAULT_DOWNGRADE_INTERVAL_MS}`,
    10
  );
  const notificationIntervalMs = parseInt(
    process.env.TIER_NOTIFICATION_INTERVAL_MS || `${DEFAULT_NOTIFICATION_INTERVAL_MS}`,
    10
  );

  // Kick off immediately on startup, then at intervals
  runDowngradeJobOnce().catch(err => logger.error('Initial downgrade job failed:', err));
  runNotificationJobOnce().catch(err => logger.error('Initial notification job failed:', err));

  downgradeIntervalHandle = setInterval(() => {
    runDowngradeJobOnce().catch(err => logger.error('Scheduled downgrade job failed:', err));
  }, downgradeIntervalMs);

  notificationIntervalHandle = setInterval(() => {
    runNotificationJobOnce().catch(err => logger.error('Scheduled notification job failed:', err));
  }, notificationIntervalMs);

  logger.info(
    `Tier scheduler started (downgrade every ${downgradeIntervalMs}ms, notifications every ${notificationIntervalMs}ms)`
  );
}

export function stopTierScheduler(): void {
  if (downgradeIntervalHandle) {
    clearInterval(downgradeIntervalHandle);
    downgradeIntervalHandle = null;
  }
  if (notificationIntervalHandle) {
    clearInterval(notificationIntervalHandle);
    notificationIntervalHandle = null;
  }
  logger.info('Tier scheduler stopped');
}
