import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { main, migrate } from '../../scripts/migrate.js';
import { connect, getTestDbUrl, resetDb } from '../helpers/testDb.js';

const connectionString = getTestDbUrl();
let client;
let dir;

const history = async () =>
  (await client.query('SELECT filename FROM schema_migrations ORDER BY filename')).rows.map(
    (r) => r.filename,
  );
const tableExists = async (name) =>
  (await client.query('SELECT to_regclass($1) AS t', [`public.${name}`])).rows[0].t !== null;
const write = (name, sql) => fs.writeFile(path.join(dir, name), sql);

beforeAll(async () => {
  client = await connect();
});
afterAll(async () => {
  await client.end();
});
beforeEach(async () => {
  await resetDb(client);
  dir = await fs.mkdtemp(path.join(os.tmpdir(), 'migr-'));
});
afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true });
  process.exitCode = 0;
});

describe('migrate()', () => {
  it('순번대로 적용하고 이력을 기록', async () => {
    await write('0002_b.sql', 'CREATE TABLE b (id INT);');
    await write('0001_a.sql', 'CREATE TABLE a (id INT);');
    expect(await migrate({ connectionString, dir })).toEqual(['0001_a.sql', '0002_b.sql']);
    expect(await history()).toEqual(['0001_a.sql', '0002_b.sql']);
    expect(await tableExists('a')).toBe(true);
    expect(await tableExists('b')).toBe(true);
  });

  it('재실행 시 빈 배열을 반환하고 다시 실행하지 않음', async () => {
    await write('0001_a.sql', 'CREATE TABLE a (id INT);'); // 재실행되면 already exists로 실패
    await migrate({ connectionString, dir });
    expect(await migrate({ connectionString, dir })).toEqual([]);
    expect(await history()).toEqual(['0001_a.sql']);
  });

  it('중간 파일 SQL 오류 시 롤백·미기록·throw, 앞선 파일은 유지, 이후 파일 중단', async () => {
    await write('0001_a.sql', 'CREATE TABLE a (id INT);');
    await write('0002_b.sql', 'CREATE TABLE b (id INT); THIS IS NOT SQL;');
    await write('0003_c.sql', 'CREATE TABLE c (id INT);');
    await expect(migrate({ connectionString, dir })).rejects.toThrow('0002_b.sql');
    expect(await tableExists('b')).toBe(false);
    expect(await tableExists('c')).toBe(false);
    expect(await tableExists('a')).toBe(true);
    expect(await history()).toEqual(['0001_a.sql']);
  });

  it('이름 규칙에 맞지 않는 파일은 무시', async () => {
    await write('0001_a.sql', 'CREATE TABLE a (id INT);');
    await write('readme.txt', 'x');
    await write('abc.sql', 'THIS IS NOT SQL;');
    expect(await migrate({ connectionString, dir })).toEqual(['0001_a.sql']);
  });
});

describe('main()', () => {
  it('실패 시 exitCode=1 (throw 안 함)', async () => {
    await main({
      DB_CONN_STRING: 'postgresql://postgres:postgres@localhost:1/none',
      JWT_SECRET: 'x'.repeat(64),
    });
    expect(process.exitCode).toBe(1);
  });

  it('성공 시 기본 dir의 0001_init.sql 적용', async () => {
    await main({ DB_CONN_STRING: connectionString, JWT_SECRET: 'x'.repeat(64) });
    expect(process.exitCode).not.toBe(1);
    expect(await history()).toContain('0001_init.sql');
  });

  it('적용할 파일이 없으면 그대로 성공', async () => {
    const env = { DB_CONN_STRING: connectionString, JWT_SECRET: 'x'.repeat(64) };
    await main(env);
    await main(env);
    expect(process.exitCode).not.toBe(1);
    expect(await history()).toEqual(['0001_init.sql']);
  });
});
