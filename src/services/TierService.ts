import { SubscriptionPlan } from '../types';
import { UserModel } from '../models/UserModel';
import { TierFeatureModel } from '../models/TierFeatureModel';
import { TierHistoryModel, TierHistoryRecord } from '../models/TierHistoryModel';
import { TierFeatureDefinitionsModel } from '../models/TierFeatureDefinitionsModel';
import { logger } from '../utils/logger';
import { TierNotificationService } from './TierNotificationService';

// Tier feature and usage interfaces
export interface TierFeatureValue {
  unlimited?: boolean;
  limit?: number;
  enabled?: boolean;
}

export interface UserFeatureUsage {
  current: number;
  limit: number | null;
}

export interface TierStatus {
  user_id: string;
  subscription_plan: SubscriptionPlan;
  subscription_expires_at: Date | null;
  is_active: boolean;
  days_until_expiration: number | null;
  grace_period_active: boolean;
  grace_period_expires_at: Date | null;
  tier_features: Record<string, TierFeatureValue>;
  current_usage: Record<string, UserFeatureUsage>;
}

export interface TierChangeData {
  user_id: string;
  previous_plan: SubscriptionPlan;
  new_plan: SubscriptionPlan;
  change_reason: string;
  changed_by?: string;
  notes?: string;
}

export class TierService {
  private readonly userModel: UserModel;
  private readonly tierFeatureModel: TierFeatureModel;
  private readonly tierHistoryModel: TierHistoryModel;
  private readonly tierFeatureDefinitionsModel: TierFeatureDefinitionsModel;
  private readonly notificationService: TierNotificationService;

  constructor() {
    this.userModel = new UserModel();
    this.tierFeatureModel = new TierFeatureModel();
    this.tierHistoryModel = new TierHistoryModel();
    this.tierFeatureDefinitionsModel = new TierFeatureDefinitionsModel();
    this.notificationService = new TierNotificationService();
  }

  /**
   * Get comprehensive tier status for a user
   */
  async getUserTierStatus(userId: string): Promise<TierStatus> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const subscriptionExpiresAt = user.subscription_expires_at || null;
    const isExpired = this.checkSubscriptionExpiration(subscriptionExpiresAt);
    const gracePeriodEnd = isExpired ? this.calculateGracePeriod(subscriptionExpiresAt) : null;
    const gracePeriodActive = isExpired && this.isGracePeriodActive(gracePeriodEnd);

    const daysUntilExpiration = subscriptionExpiresAt
      ? Math.ceil((subscriptionExpiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const tierFeatures = await this.getTierFeatures(user.subscription_plan);
    const userFeatureUsageArr = await this.tierFeatureModel.getUserFeatureUsage(userId);

    // Convert array to Record
    const userFeatureUsage: Record<string, UserFeatureUsage> = {};
    for (const row of userFeatureUsageArr) {
      userFeatureUsage[row.feature_name] = {
        current: row.current_usage,
        limit: row.usage_limit,
      };
    }

    return {
      user_id: userId,
      subscription_plan: user.subscription_plan,
      subscription_expires_at: subscriptionExpiresAt,
      is_active: user.is_active,
      days_until_expiration: daysUntilExpiration,
      grace_period_active: gracePeriodActive,
      grace_period_expires_at: gracePeriodEnd,
      tier_features: tierFeatures,
      current_usage: userFeatureUsage,
    };
  }

  /**
   * Check if subscription has expired
   */
  checkSubscriptionExpiration(expiration: Date | null): boolean {
    if (!expiration) return false;
    return expiration < new Date();
  }

  /**
   * Calculate grace period end date (7 days after expiration)
   */
  calculateGracePeriod(expiration: Date | null): Date | null {
    if (!expiration) return null;
    const gracePeriodEnd = new Date(expiration);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);
    return gracePeriodEnd;
  }

  /**
   * Check if grace period is still active
   */
  isGracePeriodActive(gracePeriodEnd: Date | null): boolean {
    if (!gracePeriodEnd) return false;
    return gracePeriodEnd > new Date();
  }

  /**
   * Perform automatic downgrade for expired premium users
   */
  async performAutomaticDowngrade(userId: string): Promise<boolean> {
    const user = await this.userModel.findById(userId);
    if (!user) return false;

    // Only downgrade if user is premium and subscription has expired
    if (user.subscription_plan !== 'premium') return false;

    const subscriptionExpiresAt = user.subscription_expires_at || null;
    const isExpired = this.checkSubscriptionExpiration(subscriptionExpiresAt);
    const gracePeriodEnd = this.calculateGracePeriod(subscriptionExpiresAt);
    const gracePeriodActive = this.isGracePeriodActive(gracePeriodEnd);

    // Don't downgrade if still in grace period
    if (gracePeriodActive) return false;

    // Don't downgrade if subscription is still active
    if (!isExpired) return false;

    try {
      // Update user to free tier
      await this.userModel.update(userId, {
        subscription_plan: 'free',
        subscription_expires_at: undefined,
      });

      // Record the tier change
      await this.recordTierChange({
        user_id: userId,
        previous_plan: 'premium',
        new_plan: 'free',
        change_reason: 'expiration',
      });

      logger.info(`User ${userId} automatically downgraded from premium to free due to expiration`);
      try {
        const user = await this.userModel.findById(userId);
        if (user) {
          await this.notificationService.sendTierChangeNotification(
            user,
            'premium',
            'free',
            'expiration'
          );
        }
      } catch (notifyError) {
        logger.warn('Failed to send automatic downgrade notification:', notifyError);
      }
      return true;
    } catch (error) {
      logger.error(`Failed to downgrade user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Manually upgrade a user to premium (optionally set expiration)
   */
  async upgradeUserToPremium(
    userId: string,
    options?: { expiresAt?: Date; changedBy?: string; notes?: string }
  ): Promise<boolean> {
    const user = await this.userModel.findById(userId);
    if (!user) return false;

    const expiresAt = options?.expiresAt ?? user.subscription_expires_at ?? null;
    try {
      await this.userModel.update(userId, {
        subscription_plan: 'premium',
        subscription_expires_at: expiresAt ?? undefined,
      });

      await this.recordTierChange({
        user_id: userId,
        previous_plan: user.subscription_plan,
        new_plan: 'premium',
        change_reason: 'upgrade',
        changed_by: options?.changedBy || '',
        notes: options?.notes || '',
      });

      const fresh = await this.userModel.findById(userId);
      if (fresh) {
        await this.notificationService.sendTierChangeNotification(
          fresh,
          user.subscription_plan,
          'premium',
          'upgrade'
        );
      }
      return true;
    } catch (error) {
      logger.error('Failed to upgrade user to premium:', error);
      return false;
    }
  }

  /**
   * Manually downgrade a user to free
   */
  async downgradeUserToFree(
    userId: string,
    options?: { changedBy?: string; notes?: string }
  ): Promise<boolean> {
    const user = await this.userModel.findById(userId);
    if (!user) return false;
    if (user.subscription_plan === 'free') return true; // idempotent

    try {
      await this.userModel.update(userId, {
        subscription_plan: 'free',
        subscription_expires_at: undefined,
      });

      await this.recordTierChange({
        user_id: userId,
        previous_plan: user.subscription_plan,
        new_plan: 'free',
        change_reason: 'downgrade',
        changed_by: options?.changedBy || '',
        notes: options?.notes || '',
      });

      const fresh = await this.userModel.findById(userId);
      if (fresh) {
        await this.notificationService.sendTierChangeNotification(
          fresh,
          user.subscription_plan,
          'free',
          'downgrade'
        );
      }
      return true;
    } catch (error) {
      logger.error('Failed to downgrade user to free:', error);
      return false;
    }
  }

  /**
   * Record tier change in history
   */
  async recordTierChange(data: TierChangeData): Promise<TierHistoryRecord> {
    const tierChangeRecord = {
      ...data,
      effective_date: new Date(),
    };

    return await this.tierHistoryModel.create(tierChangeRecord);
  }

  /**
   * Get tier features for a specific subscription plan
   */
  async getTierFeatures(tier: SubscriptionPlan): Promise<Record<string, TierFeatureValue>> {
    const features = await this.tierFeatureDefinitionsModel.findBy({ tier });
    const tierFeatures: Record<string, TierFeatureValue> = {};

    for (const feature of features) {
      if (feature.feature_limit === null) {
        tierFeatures[feature.feature_name] = feature.feature_enabled
          ? { unlimited: true }
          : { enabled: false };
      } else {
        tierFeatures[feature.feature_name] = feature.feature_enabled
          ? { limit: feature.feature_limit }
          : { enabled: false };
      }
    }

    return tierFeatures;
  }
}
