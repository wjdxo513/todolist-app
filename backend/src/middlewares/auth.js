import { AppError } from '../lib/errors.js';
import { ACCESS_COOKIE, verifyAccessToken } from '../lib/jwt.js';

export function requireAuth(req, res, next) {
  try {
    req.userId = verifyAccessToken(req.cookies?.[ACCESS_COOKIE]);
    next();
  } catch {
    next(new AppError(401, 'UNAUTHENTICATED', '로그인이 필요합니다.'));
  }
}
