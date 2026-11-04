import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import pg from 'pg';
import { parseEnv } from '../src/config/env.js';

const DEFAULT_DIR = new URL('../migrations/', import.meta.url);

export async function migrate({ connectionString, dir = fileURLToPath(DEFAULT_DIR) }) {
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    await client.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         filename TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
    );
    const done = new Set(
      (await client.query('SELECT filename FROM schema_migrations')).rows.map((r) => r.filename),
    );
    const files = (await readdir(dir)).filter((f) => /^\d{4}_.+\.sql$/.test(f)).sort();
    const applied = [];
    for (const filename of files) {
      if (done.has(filename)) continue;
      const sql = await readFile(join(dir, filename), 'utf8');
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations(filename) VALUES ($1)', [filename]);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`마이그레이션 실패 ${filename}: ${err.message}`, { cause: err });
      }
      applied.push(filename);
    }
    return applied;
  } finally {
    await client.end();
  }
}

export async function main(env = process.env) {
  try {
    const applied = await migrate({ connectionString: parseEnv(env).DB_CONN_STRING });
    console.log(applied.length ? `적용: ${applied.join(', ')}` : '적용할 마이그레이션 없음');
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  }
}

/* v8 ignore next */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
