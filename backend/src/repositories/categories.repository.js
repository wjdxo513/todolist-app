import { pool } from '../db/pool.js';
import { query } from '../db/query.js';

const COLS = 'id, name, is_default';

export const listByUser = (userId, executor = pool) =>
  query(`SELECT ${COLS} FROM categories WHERE user_id = $1 ORDER BY id`, [userId], executor);

export const insert = async (userId, name, isDefault = false, executor = pool) =>
  (
    await query(
      `INSERT INTO categories (user_id, name, is_default) VALUES ($1, $2, $3) RETURNING ${COLS}`,
      [userId, name, isDefault],
      executor,
    )
  )[0];

export const findOwned = async (userId, id, executor = pool) =>
  (
    await query(
      `SELECT ${COLS} FROM categories WHERE id = $1 AND user_id = $2`,
      [id, userId],
      executor,
    )
  )[0];

export const findDefault = async (userId, executor = pool) =>
  (
    await query(
      `SELECT ${COLS} FROM categories WHERE user_id = $1 AND is_default = true`,
      [userId],
      executor,
    )
  )[0];

export const rename = async (userId, id, name, executor = pool) =>
  (
    await query(
      `UPDATE categories SET name = $3 WHERE id = $1 AND user_id = $2 AND is_default = false RETURNING ${COLS}`,
      [id, userId, name],
      executor,
    )
  )[0];

export const deleteNonDefault = async (userId, id, executor = pool) =>
  (
    await query(
      'DELETE FROM categories WHERE id = $1 AND user_id = $2 AND is_default = false RETURNING id',
      [id, userId],
      executor,
    )
  ).length;
