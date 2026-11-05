import { pool } from '../db/pool.js';
import { overlapCondition, statusCondition } from '../domain/todoStatus.js';
import { query } from '../db/query.js';

const COLS =
  'id, category_id, title, memo, start_date, end_date, is_completed, created_at, updated_at';

export const insert = async (userId, t, executor = pool) =>
  (
    await query(
      `INSERT INTO todos (user_id, category_id, title, memo, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING ${COLS}`,
      [userId, t.categoryId, t.title, t.memo || null, t.startDate, t.endDate],
      executor,
    )
  )[0];

export const findOwned = async (userId, id, executor = pool) =>
  (
    await query(`SELECT ${COLS} FROM todos WHERE id = $1 AND user_id = $2`, [id, userId], executor)
  )[0];

export const update = async (userId, id, t, executor = pool) =>
  (
    await query(
      `UPDATE todos SET category_id = $3, title = $4, memo = $8, start_date = $5, end_date = $6,
         is_completed = $7, updated_at = now()
       WHERE id = $1 AND user_id = $2 RETURNING ${COLS}`,
      [id, userId, t.categoryId, t.title, t.startDate, t.endDate, t.isCompleted, t.memo || null],
      executor,
    )
  )[0];

export const setCompletion = async (userId, id, isCompleted, executor = pool) =>
  (
    await query(
      `UPDATE todos SET is_completed = $3, updated_at = now()
       WHERE id = $1 AND user_id = $2 RETURNING ${COLS}`,
      [id, userId, isCompleted],
      executor,
    )
  )[0];

export const remove = async (userId, id, executor = pool) =>
  (
    await query(
      'DELETE FROM todos WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId],
      executor,
    )
  ).length;

export const moveToCategory = (userId, fromCategoryId, toCategoryId, executor = pool) =>
  query(
    'UPDATE todos SET category_id = $3, updated_at = now() WHERE user_id = $1 AND category_id = $2',
    [userId, fromCategoryId, toCategoryId],
    executor,
  );

// 조각은 domain의 고정 SQL과 자리표시자뿐이고 값은 모두 바인딩한다
function listWhere(userId, { today, categoryId, status }) {
  const params = [userId];
  let where = 'user_id = $1';
  if (categoryId !== undefined) {
    params.push(categoryId);
    where += ` AND category_id = $${params.length}`;
  }
  if (status !== undefined) {
    params.push(today);
    where += ` AND (${statusCondition(status, `$${params.length}`)})`;
  }
  return { where, params };
}

export const findPage = async (userId, filter, { limit, offset }, executor = pool) => {
  const { where, params } = listWhere(userId, filter);
  params.push(limit, offset);
  return query(
    `SELECT ${COLS} FROM todos WHERE ${where}
     ORDER BY end_date, created_at, id LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
    executor,
  );
};

export const countFiltered = async (userId, filter, executor = pool) => {
  const { where, params } = listWhere(userId, filter);
  const rows = await query(`SELECT count(*)::int AS n FROM todos WHERE ${where}`, params, executor);
  return rows[0].n;
};

export const findOverlapping = (userId, from, to, executor = pool) =>
  query(
    `SELECT ${COLS} FROM todos WHERE user_id = $1 AND (${overlapCondition('$2', '$3')})
     ORDER BY end_date, created_at, id`,
    [userId, from, to],
    executor,
  );
