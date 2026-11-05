import pg from 'pg';
import { loadEnv } from '../config/env.js';
import { logger } from '../lib/logger.js';

pg.types.setTypeParser(1082, (v) => v); // date는 문자열 그대로 (NP-18)
pg.types.setTypeParser(20, Number); // int8(count 등)는 Number

const env = loadEnv();

export const pool = new pg.Pool({
  connectionString: env.DB_CONN_STRING,
  max: env.DB_POOL_MAX,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => logger.error({ err }, 'pg pool error'));
