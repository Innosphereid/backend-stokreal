import { LoginResponse } from '@/types/auth';
import { LoginResponse as JWTLoginResponse } from '@/types/jwt';
import { User } from '@/types';

export class LoginResource {
  /**
   * Format user data for login response
   */
  static formatLoginResponse(loginData: JWTLoginResponse, user: User): LoginResponse {
    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        subscription_plan: user.subscription_plan,
        subscription_expires_at: user.subscription_expires_at,
      },
      tokens: {
        access_token: loginData.tokens.accessToken,
        refresh_token: loginData.tokens.refreshToken,
        expires_in: 86400, // 24 hours in seconds
      },
    };
  }
}
