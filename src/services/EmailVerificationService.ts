import { db } from '@/config/database';
import { logger } from '@/utils/logger';

export interface EmailVerification {
  id?: string;
  user_id: string;
  verification_token: string;
  token_type: string;
  expires_at: Date;
  is_used: boolean;
  used_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export class EmailVerificationService {
  private readonly tableName = 'user_email_verifications';

  /**
   * Create a new email verification record
   */
  async createVerification(data: {
    userId: string;
    token: string;
    purpose: string;
    expiresAt: Date;
  }): Promise<EmailVerification> {
    try {
      const [verification] = await db(this.tableName)
        .insert({
          user_id: data.userId,
          verification_token: data.token,
          token_type: data.purpose,
          expires_at: data.expiresAt,
          is_used: false,
        })
        .returning('*');

      logger.info(`Email verification created for user ${data.userId}, purpose: ${data.purpose}`);
      return verification;
    } catch (error) {
      logger.error('Failed to create email verification:', error);
      throw error;
    }
  }

  /**
   * Find verification by token
   */
  async findByToken(token: string): Promise<EmailVerification | null> {
    try {
      const verification = await db(this.tableName).where({ verification_token: token }).first();

      return verification || null;
    } catch (error) {
      logger.error('Failed to find email verification by token:', error);
      return null;
    }
  }

  /**
   * Mark verification as used
   */
  async markAsUsed(token: string): Promise<void> {
    try {
      await db(this.tableName).where({ verification_token: token }).update({
        is_used: true,
        used_at: new Date(),
        updated_at: new Date(),
      });

      logger.info(`Email verification marked as used for token: ${token}`);
    } catch (error) {
      logger.error('Failed to mark email verification as used:', error);
      throw error;
    }
  }

  /**
   * Clean up expired verifications
   */
  async cleanupExpired(): Promise<void> {
    try {
      const deletedCount = await db(this.tableName).where('expires_at', '<', new Date()).del();

      if (deletedCount > 0) {
        logger.info(`Cleaned up ${deletedCount} expired email verifications`);
      }
    } catch (error) {
      logger.error('Failed to cleanup expired email verifications:', error);
    }
  }

  /**
   * Get active verifications for a user
   */
  async getActiveVerifications(userId: string): Promise<EmailVerification[]> {
    try {
      return await db(this.tableName)
        .where({
          user_id: userId,
          is_used: false,
        })
        .where('expires_at', '>', new Date())
        .orderBy('created_at', 'desc');
    } catch (error) {
      logger.error('Failed to get active verifications for user:', error);
      return [];
    }
  }

  /**
   * Delete verification by ID
   */
  async deleteVerification(id: string): Promise<void> {
    try {
      await db(this.tableName).where({ id }).del();

      logger.info(`Email verification deleted: ${id}`);
    } catch (error) {
      logger.error('Failed to delete email verification:', error);
      throw error;
    }
  }
}
