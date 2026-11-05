import { pool } from '../db/pool.js';
import { query } from '../db/query.js';

const PUBLIC = 'id, email, name';

export const insert = async ({ email, passwordHash, name }, executor = pool) =>
  (
    await query(
      `INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING ${PUBLIC}`,
      [email, passwordHash, name],
      executor,
    )
  )[0];

export const findById = async (userId, executor = pool) =>
  (await query(`SELECT ${PUBLIC} FROM users WHERE id = $1`, [userId], executor))[0];

// password_hash는 인증용 조회 함수에서만 반환한다
export const findAuthByEmail = async (email, executor = pool) =>
  (
    await query(`SELECT ${PUBLIC}, password_hash FROM users WHERE email = $1`, [email], executor)
  )[0];

export const findAuthById = async (userId, executor = pool) =>
  (await query('SELECT password_hash FROM users WHERE id = $1', [userId], executor))[0];

export const updateName = async (userId, name, executor = pool) =>
  (
    await query(
      `UPDATE users SET name = $2 WHERE id = $1 RETURNING ${PUBLIC}`,
      [userId, name],
      executor,
    )
  )[0];

export const updatePasswordHash = (userId, passwordHash, executor = pool) =>
  query('UPDATE users SET password_hash = $2 WHERE id = $1', [userId, passwordHash], executor);
