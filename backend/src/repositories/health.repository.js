import { pool } from '../db/pool.js';

export function ping(executor = pool) {
  return executor.query('SELECT 1');
}
