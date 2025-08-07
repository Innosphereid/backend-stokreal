import db from '../config/database';

/**
 * Model for tier_feature_definitions table operations.
 */
export class TierFeatureDefinitionsModel {
  /**
   * Find feature definitions by query (e.g., by tier, feature_name, etc).
   */
  async findBy(
    query: Partial<{
      tier: string;
      feature_name: string;
      feature_enabled: boolean;
    }>
  ): Promise<any[]> {
    return db('tier_feature_definitions').where(query).select('*');
  }

  /**
   * Get all feature definitions for a tier.
   */
  async getByTier(tier: string): Promise<any[]> {
    return db('tier_feature_definitions').where({ tier }).select('*');
  }

  /**
   * Get a single feature definition by tier and feature name.
   */
  async getByTierAndFeature(tier: string, feature_name: string): Promise<any> {
    return db('tier_feature_definitions').where({ tier, feature_name }).first();
  }

  /**
   * Create a new feature definition.
   */
  async create(data: {
    tier: string;
    feature_name: string;
    feature_limit?: number;
    feature_enabled?: boolean;
    description?: string;
  }): Promise<any> {
    return db('tier_feature_definitions')
      .insert({
        ...data,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');
  }
}
