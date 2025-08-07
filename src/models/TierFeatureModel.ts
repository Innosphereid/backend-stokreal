import db from '../config/database';

/**
 * Model for user_tier_features table operations.
 */
export class TierFeatureModel {
  /**
   * Increment feature usage for a user.
   */
  async incrementUsage(userId: string, featureName: string, increment: number): Promise<any> {
    return db('user_tier_features')
      .where({ user_id: userId, feature_name: featureName })
      .increment('current_usage', increment)
      .update({ updated_at: db.fn.now() });
  }

  /**
   * Atomically increment feature usage for a user (for race condition prevention).
   */
  async incrementUsageAtomic(userId: string, featureName: string, increment: number): Promise<any> {
    return db.transaction(async trx => {
      const row = await trx('user_tier_features')
        .where({ user_id: userId, feature_name: featureName })
        .forUpdate()
        .first();
      if (!row) throw new Error('Feature usage record not found');
      await trx('user_tier_features')
        .where({ user_id: userId, feature_name: featureName })
        .update({
          current_usage: row.current_usage + increment,
          updated_at: db.fn.now(),
        });
      return { ...row, current_usage: row.current_usage + increment };
    });
  }

  /**
   * Get all feature usage for a user.
   */
  async getUserFeatureUsage(userId: string): Promise<any[]> {
    return db('user_tier_features').where({ user_id: userId }).select('*');
  }

  /**
   * Reset usage counters for a given type (e.g., daily, monthly) at a specific date.
   */
  async resetUsageCounters(resetType: string, date: Date): Promise<any> {
    // Example: reset all counters (customize as needed)
    return db('user_tier_features').update({
      current_usage: 0,
      last_reset_at: date,
      updated_at: db.fn.now(),
    });
  }

  /**
   * Create a new user_tier_features record.
   */
  async create(data: {
    user_id: string;
    feature_name: string;
    usage_limit?: number;
    current_usage?: number;
    last_reset_at?: Date;
  }): Promise<any> {
    return db('user_tier_features')
      .insert({
        ...data,
        current_usage: data.current_usage ?? 0,
        last_reset_at: data.last_reset_at ?? new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');
  }
}
