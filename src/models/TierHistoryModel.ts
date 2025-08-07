import db from '../config/database';

/**
 * Model for user_tier_history table operations.
 */
export class TierHistoryModel {
  /**
   * Create a new tier history record.
   */
  async create(data: {
    user_id: string;
    previous_plan?: string;
    new_plan: string;
    change_reason: string;
    changed_by?: string;
    effective_date: Date;
    notes?: string;
  }): Promise<any> {
    return db('user_tier_history')
      .insert({
        ...data,
        created_at: new Date(),
      })
      .returning('*');
  }
}
