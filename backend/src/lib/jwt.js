import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { loadEnv } from '../config/env.js';

export const ACCESS_TOKEN_TTL_SEC = 900;
export const REFRESH_TOKEN_TTL_SEC = 604800;
export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';

export function signAccessToken(userId) {
  return jwt.sign({}, loadEnv().JWT_SECRET, {
    algorithm: 'HS384',
    expiresIn: ACCESS_TOKEN_TTL_SEC,
    subject: String(userId),
  });
}

export function verifyAccessToken(token) {
  const payload = jwt.verify(token, loadEnv().JWT_SECRET, { algorithms: ['HS384'] });
  return Number(payload.sub);
}

export const createRefreshToken = () => crypto.randomBytes(32).toString('base64url');
export const hashRefreshToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const clearOptions = (path) => ({
  httpOnly: true,
  sameSite: 'lax',
  path,
  secure: loadEnv().NODE_ENV === 'production',
});

export const clearAccessCookieOptions = () => clearOptions('/');
export const clearRefreshCookieOptions = () => clearOptions('/api/auth');
export const accessCookieOptions = () => ({
  ...clearAccessCookieOptions(),
  maxAge: ACCESS_TOKEN_TTL_SEC * 1000,
});
export const refreshCookieOptions = () => ({
  ...clearRefreshCookieOptions(),
  maxAge: REFRESH_TOKEN_TTL_SEC * 1000,
});
