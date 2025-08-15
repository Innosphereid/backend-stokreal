import db from '../config/database';

// Database operation result interfaces
export interface TierFeatureRecord {
  id: string;
  user_id: string;
  feature_name: string;
  current_usage: number;
  usage_limit: number | null;
  last_reset_at: Date;
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
  current_usage: number;
  usage_limit: number | null;
  last_reset_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ResetCountersResult {
  affectedRows: number;
}

/**
 * Model for user_tier_features table operations.
 */
export class TierFeatureModel {
  /**
   * Increment feature usage for a user.
   */
  async incrementUsage(
    userId: string,
    featureName: string,
    increment: number,
    trx?: any
  ): Promise<IncrementResult> {
    const dbOrTrx = trx || db;
    const result = await dbOrTrx('user_tier_features')
      .where({ user_id: userId, feature_name: featureName })
      .increment('current_usage', increment)
      .update({ updated_at: db.fn.now() })
      .returning(['current_usage', 'updated_at']);
    return {
      current_usage: result[0]?.current_usage || 0,
      updated_at: result[0]?.updated_at || new Date(),
    };
  }

  /**
   * Atomically increment feature usage for a user (for race condition prevention).
   */
  async incrementUsageAtomic(
    userId: string,
    featureName: string,
    increment: number,
    trx?: any
  ): Promise<IncrementResult> {
    const run = async (transaction: any) => {
      const row = await transaction('user_tier_features')
        .where({ user_id: userId, feature_name: featureName })
        .forUpdate()
        .first();
      if (!row) throw new Error('Feature usage record not found');
      const newUsage = row.current_usage + increment;
      await transaction('user_tier_features')
        .where({ user_id: userId, feature_name: featureName })
        .update({
          current_usage: newUsage,
          updated_at: db.fn.now(),
        });
      return {
        current_usage: newUsage,
        updated_at: new Date(),
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
    trx?: any
  ): Promise<CreateFeatureRecordResult> {
    const dbOrTrx = trx || db;
    const result = await dbOrTrx('user_tier_features')
      .insert({
        ...data,
        current_usage: data.current_usage ?? 0,
        last_reset_at: data.last_reset_at ?? new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');
    return result[0] as CreateFeatureRecordResult;
  }
}
