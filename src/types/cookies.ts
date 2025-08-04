import { CookieUtils, cookieNames } from '@/config/cookies';

// Extend Express Request interface to include cookie utilities
declare module 'express-serve-static-core' {
  interface Request {
    cookieUtils: typeof CookieUtils;
    authToken?: string;
    sessionId?: string;
    jwtAccessToken?: string;
    jwtRefreshToken?: string;
  }

  interface Response {
    setCookie: (name: string, value: string, type?: keyof typeof cookieNames) => Response;
    setAuthCookie: (token: string) => Response;
    clearAuthCookie: () => Response;
    setSessionCookie: (sessionId: string) => Response;
    clearSessionCookie: () => Response;
  }
}
