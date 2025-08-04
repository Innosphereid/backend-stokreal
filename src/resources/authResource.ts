import { User } from '@/types';
import { RegisterResponse } from '@/types/auth';

export class AuthResource {
  /**
   * Format user data for registration response
   */
  static formatRegisterResponse(user: User): RegisterResponse {
    return {
      user: {
        id: user.id.toString(),
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        is_active: user.is_active,
      },
    };
  }
}
