import { db } from '@/config/database';
import { Knex } from 'knex';
import { getFeatureDisplayName } from '@/constants/featureDisplayNames';

export interface TierFeatureRecord {
  id: string;
  user_id: string;
  feature_name: string;
  usage_limit: number | null;
  current_usage: number;
  last_reset_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface IncrementResult {
  current_usage: number;
  updated_at: Date;
}

export interface CreateFeatureRecordResult {
  id: string;
  user_id: string;
  feature_name: string;
  usage_limit: number | null;
  current_usage: number;
  last_reset_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface ResetCountersResult {
  affectedRows: number;
}

export class TierFeatureModel {
  private readonly tableName = 'user_tier_features';

  /**
   * Increment feature usage for a user.
   */
  async incrementUsage(
    userId: string,
    featureName: string,
    increment: number,
    trx?: Knex.Transaction
  ): Promise<IncrementResult> {
    const dbOrTrx = trx || db;
    const result = await dbOrTrx('user_tier_features')
      .where({ user_id: userId, feature_name: featureName })
      .increment('current_usage', increment)
      .update({ updated_at: db.fn.now() })
      .returning(['current_usage', 'updated_at']);
    return {
      current_usage: result[0]?.current_usage || 0,
      updated_at: result[0]?.updated_at || db.fn.now(),
    };
  }

  /**
   * Atomically increment feature usage for a user (for race condition prevention).
   */
  async incrementUsageAtomic(
    userId: string,
    featureName: string,
    increment: number,
    trx?: Knex.Transaction
  ): Promise<IncrementResult> {
    const run = async (transaction: Knex.Transaction) => {
      const row = await transaction('user_tier_features')
        .where({ user_id: userId, feature_name: featureName })
        .forUpdate()
        .first();
      if (!row) throw new Error('Feature usage record not found');
      const newUsage = row.current_usage + increment;

      // Validate usage limits based on increment direction
      this.validateUsageLimits(featureName, increment, newUsage, row.usage_limit);
      const result = await transaction('user_tier_features')
        .where({ user_id: userId, feature_name: featureName })
        .update({
          current_usage: newUsage,
          updated_at: db.fn.now(),
        })
        .returning('*');

      const updatedRecord = result[0];
      return {
        current_usage: newUsage,
        updated_at: updatedRecord.updated_at,
      };
    };
    if (trx) {
      return run(trx);
    } else {
      return db.transaction(run);
    }
  }

  /**
   * Get all feature usage for a user.
   */
  async getUserFeatureUsage(userId: string): Promise<TierFeatureRecord[]> {
    return db('user_tier_features').where({ user_id: userId }).select('*');
  }

  /**
   * Reset usage counters for a given type (e.g., daily, monthly) at a specific date.
   */
  async resetUsageCounters(resetType: string, date: Date): Promise<ResetCountersResult> {
    // Example: reset all counters (customize as needed)
    const result = await db('user_tier_features').update({
      current_usage: 0,
      last_reset_at: date,
      updated_at: db.fn.now(),
    });

    return {
      affectedRows: result,
    };
  }

  /**
   * Create a new user_tier_features record.
   */
  async create(
    data: {
      user_id: string;
      feature_name: string;
      usage_limit?: number;
      current_usage?: number;
      last_reset_at?: Date;
    },
    trx?: Knex.Transaction
  ): Promise<CreateFeatureRecordResult> {
    const dbOrTrx = trx || db;
    const result = await dbOrTrx('user_tier_features')
      .insert({
        ...data,
        current_usage: data.current_usage ?? 0,
        last_reset_at: data.last_reset_at ?? db.fn.now(),
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      })
      .returning('*');
    return result[0];
  }

  /**
   * Update an existing user_tier_features record.
   */
  async update(
    userId: string,
    featureName: string,
    data: Partial<Omit<TierFeatureRecord, 'id' | 'user_id' | 'feature_name' | 'created_at'>>,
    trx?: Knex.Transaction
  ): Promise<TierFeatureRecord | null> {
    const dbOrTrx = trx || db;
    const result = await dbOrTrx('user_tier_features')
      .where({ user_id: userId, feature_name: featureName })
      .update({
        ...data,
        updated_at: db.fn.now(),
      })
      .returning('*');
    return result[0] || null;
  }

  /**
   * Delete a user_tier_features record.
   */
  async delete(userId: string, featureName: string, trx?: Knex.Transaction): Promise<boolean> {
    const dbOrTrx = trx || db;
    const deletedRows = await dbOrTrx('user_tier_features')
      .where({ user_id: userId, feature_name: featureName })
      .del();
    return deletedRows > 0;
  }

  /**
   * Find a specific feature usage record for a user.
   */
  async findByUserAndFeature(
    userId: string,
    featureName: string,
    trx?: Knex.Transaction
  ): Promise<TierFeatureRecord | null> {
    const dbOrTrx = trx || db;
    const record = await dbOrTrx('user_tier_features')
      .where({ user_id: userId, feature_name: featureName })
      .first();
    return record || null;
  }

  /**
   * Validate usage limits based on increment direction.
   * @param featureName - The name of the feature being validated
   * @param increment - The increment amount (positive for adding, negative for removing)
   * @param newUsage - The new usage value after increment
   * @param usageLimit - The maximum allowed usage limit
   * @throws Error if usage limits are exceeded
   */
  private validateUsageLimits(
    featureName: string,
    increment: number,
    newUsage: number,
    usageLimit: number | null
  ): void {
    if (increment > 0) {
      // Creating/adding: check upper limit
      if (usageLimit !== null && typeof usageLimit === 'number' && newUsage > usageLimit) {
        throw new Error(
          this.generateErrorMessage(featureName, increment, usageLimit, 'limit_exceeded')
        );
      }
    } else if (increment < 0) {
      // Removing: check lower limit (can't go below 0)
      if (newUsage < 0) {
        throw new Error(this.generateErrorMessage(featureName, increment, 0, 'below_zero'));
      }
    }
  }

  /**
   * Generate user-friendly error messages for feature usage limits.
   */
  private generateErrorMessage(
    featureName: string,
    increment: number,
    usageLimit: number,
    context: 'limit_exceeded' | 'below_zero'
  ): string {
    // Use centralized feature display names for consistency
    const displayName = getFeatureDisplayName(featureName);

    if (context === 'limit_exceeded') {
      return `Limit exceeded. You can add up to ${usageLimit} ${displayName} with your current plan.`;
    } else if (context === 'below_zero') {
      return `Cannot remove more ${displayName}. Current usage would go below 0.`;
    }
    return `An unexpected usage error occurred for ${displayName}.`;
  }
}
