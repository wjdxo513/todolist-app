import pg from 'pg';
import { beforeAll, beforeEach } from 'vitest';
import { migrate } from '../scripts/migrate.js';

export function assertTestDbUrl(url) {
  if (!url || !/_test(\?.*)?$/.test(url)) {
    throw new Error('TEST_DATABASE_URL must be set and end with _test');
  }
}

assertTestDbUrl(process.env.TEST_DATABASE_URL);
process.env.DB_CONN_STRING = process.env.TEST_DATABASE_URL;
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.BCRYPT_COST = '4';

const connectionString = process.env.TEST_DATABASE_URL;

async function withClient(fn) {
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

beforeAll(async () => {
  await migrate({ connectionString });
});

beforeEach(async () => {
  await withClient(async (c) => {
    const { rows } = await c.query("SELECT to_regclass('public.users') AS t");
    if (rows[0].t) {
      await c.query('TRUNCATE users, categories, todos, refresh_tokens RESTART IDENTITY CASCADE');
    }
  });
});
