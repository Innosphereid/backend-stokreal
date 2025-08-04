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
        id: user.id.toString(),
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        role: loginData.user.role,
        is_active: user.is_active,
      },
      tokens: {
        access_token: loginData.tokens.accessToken,
        refresh_token: loginData.tokens.refreshToken,
      },
    };
  }
}
