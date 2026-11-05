import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  accessCookieOptions,
  clearAccessCookieOptions,
  clearRefreshCookieOptions,
  refreshCookieOptions,
} from '../lib/jwt.js';
import * as authService from '../services/auth.service.js';

export async function signUp(req, res) {
  res.status(201).json(await authService.signUp(req.body));
}

export async function logIn(req, res) {
  const { user, accessToken, refreshToken } = await authService.logIn(req.body);
  res.cookie(ACCESS_COOKIE, accessToken, accessCookieOptions());
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
  res.json(user);
}

export async function logOut(req, res) {
  await authService.logOut(req.cookies?.[REFRESH_COOKIE]);
  res.clearCookie(ACCESS_COOKIE, clearAccessCookieOptions());
  res.clearCookie(REFRESH_COOKIE, clearRefreshCookieOptions());
  res.status(204).end();
}

export async function refresh(req, res) {
  let tokens;
  try {
    tokens = await authService.refresh(req.cookies?.[REFRESH_COOKIE]);
  } catch (err) {
    if (err.status === 401) {
      res.clearCookie(ACCESS_COOKIE, clearAccessCookieOptions());
      res.clearCookie(REFRESH_COOKIE, clearRefreshCookieOptions());
    }
    throw err;
  }
  res.cookie(ACCESS_COOKIE, tokens.accessToken, accessCookieOptions());
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, refreshCookieOptions());
  res.status(204).end();
}
