import { Request, Response, NextFunction } from 'express';
import { CookieUtils, cookieNames } from '@/config/cookies';
import '@/types/cookies';

/**
 * Cookie middleware that adds utility methods to request and response objects
 */
export const cookieMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Add cookie utilities to request
  req.cookieUtils = CookieUtils;

  // Add cookie utility methods to response
  res.setCookie = function (
    name: string,
    value: string,
    type: keyof typeof cookieNames = 'session'
  ) {
    const options = CookieUtils.getOptions(type);
    return this.cookie(name, value, options);
  };

  res.clearCookie = function (name: string) {
    const clearOptions = CookieUtils.getClearOptions();
    return this.cookie(name, '', clearOptions);
  };

  res.setAuthCookie = function (token: string) {
    const authCookieName = CookieUtils.getName('auth');
    const options = CookieUtils.getOptions('auth');
    return this.cookie(authCookieName, token, options);
  };

  res.clearAuthCookie = function () {
    const authCookieName = CookieUtils.getName('auth');
    return this.clearCookie(authCookieName);
  };

  res.setSessionCookie = function (sessionId: string) {
    const sessionCookieName = CookieUtils.getName('session');
    const options = CookieUtils.getOptions('session');
    return this.cookie(sessionCookieName, sessionId, options);
  };

  res.clearSessionCookie = function () {
    const sessionCookieName = CookieUtils.getName('session');
    return this.clearCookie(sessionCookieName);
  };

  // JWT cookie utility methods
  res.setJWTCookies = function (accessToken: string, refreshToken?: string) {
    CookieUtils.setJWTCookies(this, accessToken, refreshToken);
    return this;
  };

  res.clearJWTCookies = function () {
    CookieUtils.clearJWTCookies(this);
    return this;
  };

  res.setAccessTokenCookie = function (token: string) {
    const accessCookieName = CookieUtils.getName('jwt_access');
    const options = CookieUtils.getOptions('jwt_access');
    return this.cookie(accessCookieName, token, options);
  };

  res.setRefreshTokenCookie = function (token: string) {
    const refreshCookieName = CookieUtils.getName('jwt_refresh');
    const options = CookieUtils.getOptions('jwt_refresh');
    return this.cookie(refreshCookieName, token, options);
  };

  res.clearAccessTokenCookie = function () {
    const accessCookieName = CookieUtils.getName('jwt_access');
    return this.clearCookie(accessCookieName);
  };

  res.clearRefreshTokenCookie = function () {
    const refreshCookieName = CookieUtils.getName('jwt_refresh');
    return this.clearCookie(refreshCookieName);
  };

  next();
};

/**
 * Middleware to validate and refresh cookies
 */
export const cookieValidationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Check if auth cookie exists and is valid
  const authCookieName = CookieUtils.getName('auth');
  const authToken = req.signedCookies[authCookieName];

  if (authToken) {
    // Add auth token to request for use in other middleware
    req.authToken = authToken;
  }

  // Check session cookie
  const sessionCookieName = CookieUtils.getName('session');
  const sessionId = req.signedCookies[sessionCookieName];

  if (sessionId) {
    // Add session ID to request for use in other middleware
    req.sessionId = sessionId;
  }

  // Extract JWT tokens from cookies
  const jwtTokens = CookieUtils.extractJWTFromCookies(req);

  // Add JWT tokens to request for use in other middleware
  if (jwtTokens.accessToken) {
    req.jwtAccessToken = jwtTokens.accessToken;
  }

  if (jwtTokens.refreshToken) {
    req.jwtRefreshToken = jwtTokens.refreshToken;
  }

  next();
};
