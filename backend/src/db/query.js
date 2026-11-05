import { pool } from './pool.js';

const camel = (s) => s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());

export async function query(text, params = [], executor = pool) {
  const { rows } = await executor.query(text, params);
  return rows.map((row) => Object.fromEntries(Object.entries(row).map(([k, v]) => [camel(k), v])));
}

export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
