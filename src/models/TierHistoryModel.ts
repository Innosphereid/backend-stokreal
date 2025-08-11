import db from '../config/database';

// Database operation result interface
export interface TierHistoryRecord {
  id: string;
  user_id: string;
  previous_plan: string | null;
  new_plan: string;
  change_reason: string;
  changed_by: string | null;
  effective_date: Date;
  notes: string | null;
  created_at: Date;
}

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
  }): Promise<TierHistoryRecord> {
    const result = await db('user_tier_history')
      .insert({
        ...data,
        created_at: new Date(),
      })
      .returning('*');

    return result[0] as TierHistoryRecord;
  }
}
