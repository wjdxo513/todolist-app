import { pool } from '../db/pool.js';
import { query } from '../db/query.js';

export const insert = (userId, tokenHash, expiresAt, executor = pool) =>
  query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, tokenHash, expiresAt],
    executor,
  );

export const deleteExpiredByUser = (userId, executor = pool) =>
  query(
    'DELETE FROM refresh_tokens WHERE user_id = $1 AND expires_at <= now()',
    [userId],
    executor,
  );

export const deleteByHash = (tokenHash, executor = pool) =>
  query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash], executor);

// 유효한 행만 삭제하며 반환(갱신 1회용 소비). now는 JS Date.
export const consume = async (tokenHash, now, executor = pool) =>
  (
    await query(
      'DELETE FROM refresh_tokens WHERE token_hash = $1 AND expires_at > $2 RETURNING user_id, expires_at',
      [tokenHash, now],
      executor,
    )
  )[0];
