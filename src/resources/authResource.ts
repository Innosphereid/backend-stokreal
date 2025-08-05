import { User } from '@/types';
import { RegisterResponse } from '@/types/auth';

export class AuthResource {
  /**
   * Format user data for registration response
   */
  static formatRegisterResponse(user: User): RegisterResponse {
    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone || undefined,
        whatsapp_number: user.whatsapp_number || undefined,
        subscription_plan: user.subscription_plan,
        is_active: user.is_active,
        created_at: user.created_at,
        email_verified: false, // TODO: Implement email verification
      },
    };
  }
}
