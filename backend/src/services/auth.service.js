import { withTransaction } from '../db/query.js';
import { AppError } from '../lib/errors.js';
import {
  REFRESH_TOKEN_TTL_SEC,
  createRefreshToken,
  hashRefreshToken,
  signAccessToken,
} from '../lib/jwt.js';
import { loginAttempts } from '../lib/loginAttempts.js';
import { logger } from '../lib/logger.js';
import { hashPassword, verifyDummy, verifyPassword } from '../lib/password.js';
import { isUniqueViolation } from '../lib/pgError.js';
import * as categories from '../repositories/categories.repository.js';
import * as refreshTokens from '../repositories/refreshTokens.repository.js';
import * as users from '../repositories/users.repository.js';

export async function signUp({ email, password, name }) {
  const passwordHash = await hashPassword(password);
  try {
    return await withTransaction(async (tx) => {
      const user = await users.insert({ email, passwordHash, name }, tx);
      await categories.insert(user.id, '기본', true, tx);
      return user;
    });
  } catch (err) {
    if (isUniqueViolation(err, 'uq_users_email')) {
      const msg = '이미 가입된 이메일입니다.';
      throw new AppError(409, 'EMAIL_ALREADY_EXISTS', msg, { email: msg });
    }
    throw err;
  }
}

export async function logIn({ email, password }) {
  if (loginAttempts.isBlocked(email)) {
    throw new AppError(
      429,
      'TOO_MANY_ATTEMPTS',
      '로그인 시도가 5회 실패했습니다. 5분 후 다시 시도해 주세요.',
    );
  }
  const found = await users.findAuthByEmail(email);
  const ok = found
    ? await verifyPassword(password, found.passwordHash)
    : await verifyDummy(password);
  if (!ok) {
    loginAttempts.recordFailure(email);
    throw new AppError(401, 'INVALID_CREDENTIALS', '이메일 또는 비밀번호가 올바르지 않습니다.');
  }
  loginAttempts.reset(email);

  const refreshToken = createRefreshToken();
  try {
    await refreshTokens.deleteExpiredByUser(found.id);
  } catch (err) {
    logger.warn({ err }, 'refresh token cleanup failed'); // D-16: 로그인은 계속
  }
  await refreshTokens.insert(
    found.id,
    hashRefreshToken(refreshToken),
    new Date(Date.now() + REFRESH_TOKEN_TTL_SEC * 1000),
  );
  return {
    user: { id: found.id, email: found.email, name: found.name },
    accessToken: signAccessToken(found.id),
    refreshToken,
  };
}

export async function logOut(refreshToken) {
  if (typeof refreshToken === 'string' && refreshToken) {
    await refreshTokens.deleteByHash(hashRefreshToken(refreshToken));
  }
}

export async function refresh(refreshToken) {
  const unauth = () => new AppError(401, 'UNAUTHENTICATED', '로그인이 필요합니다.');
  if (typeof refreshToken !== 'string' || !refreshToken) throw unauth();
  const newToken = createRefreshToken();
  const userId = await withTransaction(async (tx) => {
    const row = await refreshTokens.consume(hashRefreshToken(refreshToken), new Date(), tx);
    if (!row) return null;
    await refreshTokens.insert(row.userId, hashRefreshToken(newToken), row.expiresAt, tx);
    return row.userId;
  });
  if (userId === null) throw unauth();
  return { accessToken: signAccessToken(userId), refreshToken: newToken };
}
