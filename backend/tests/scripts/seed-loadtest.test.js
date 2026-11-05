import request from 'supertest';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { main, seed } from '../../scripts/seed-loadtest.js';
import { createApp } from '../../src/app.js';
import { pool } from '../../src/db/pool.js';
import { query } from '../../src/db/query.js';
import { deriveStatus } from '../../src/domain/todoStatus.js';
import { loginAttempts } from '../../src/lib/loginAttempts.js';

afterAll(() => pool.end());
beforeEach(() => loginAttempts.clear());
afterEach(() => {
  process.exitCode = 0;
});

const connectionString = process.env.TEST_DATABASE_URL;
const today = '2026-11-04';
const args = { connectionString, users: 3, todosPerUser: 10, today };
const n = async (t) => Number((await query(`SELECT count(*) AS n FROM ${t}`))[0].n);

describe('seed() (DB-03)', () => {
  it('반환 개수와 실제 행 수 일치, 이메일 규칙, 카테고리 5개(기본 1)', async () => {
    expect(await seed(args)).toEqual({ users: 3, todos: 30, categories: 15 });
    expect(await n('users')).toBe(3);
    expect(await n('todos')).toBe(30);
    const emails = (await query('SELECT email FROM users')).map((r) => r.email);
    for (const e of emails) expect(e).toMatch(/^loadtest\d+@example\.com$/);
    const cats = await query(
      'SELECT user_id, count(*) AS c, count(*) FILTER (WHERE is_default) AS d FROM categories GROUP BY user_id',
    );
    expect(cats).toHaveLength(3);
    for (const c of cats) expect([Number(c.c), Number(c.d)]).toEqual([5, 1]);
  });

  it('기간 유효, 카테고리 소유자 일치, 네 상태 모두 존재', async () => {
    await seed(args);
    const rows = await query(
      `SELECT to_char(t.start_date, 'YYYY-MM-DD') AS s, to_char(t.end_date, 'YYYY-MM-DD') AS e,
              t.is_completed AS done, t.user_id = c.user_id AS own
       FROM todos t JOIN categories c ON c.id = t.category_id`,
    );
    expect(rows).toHaveLength(30);
    for (const r of rows) {
      expect(r.e >= r.s).toBe(true);
      expect(r.own).toBe(true);
    }
    const statuses = new Set(
      rows.map((r) => deriveStatus({ startDate: r.s, endDate: r.e, isCompleted: r.done }, today)),
    );
    expect(statuses).toEqual(new Set(['시작 전', '진행중', '완료', '기한 초과']));
  });

  it('사용자가 이미 있으면 throw하고 데이터 불변', async () => {
    await seed(args);
    await expect(seed(args)).rejects.toThrow();
    expect([await n('users'), await n('todos'), await n('categories')]).toEqual([3, 30, 15]);
  });

  it('시드 계정으로 로그인 200 (기본 비밀번호)', async () => {
    await seed({ ...args, users: 1 });
    const [{ email }] = await query('SELECT email FROM users');
    const res = await request(createApp())
      .post('/api/auth/login')
      .send({ email, password: 'loadtest1234' });
    expect(res.status).toBe(200);
  });
});

describe('main() (DB-03)', () => {
  const env = { DB_CONN_STRING: connectionString, JWT_SECRET: 'x'.repeat(64) };

  it('성공 경로: 인자대로 시드, exitCode 1 아님', async () => {
    await main(['--users', '2', '--todos', '8'], env);
    expect(process.exitCode).not.toBe(1);
    expect(await n('users')).toBe(2);
    expect(await n('todos')).toBe(16);
  });

  it('사용자 존재 시 exitCode=1 (throw 안 함), 데이터 불변', async () => {
    await main(['--users', '2', '--todos', '8'], env);
    process.exitCode = 0;
    await main(['--users', '2', '--todos', '8'], env);
    expect(process.exitCode).toBe(1);
    expect(await n('users')).toBe(2);
    expect(await n('todos')).toBe(16);
  });
  it('알 수 없는 인자·음수는 사용법 오류로 exitCode=1, 데이터 없음', async () => {
    await main(['--bogus', '1'], env);
    expect(process.exitCode).toBe(1);
    process.exitCode = 0;
    await main(['--users', '-1'], env);
    expect(process.exitCode).toBe(1);
    expect(await n('users')).toBe(0);
  });
});

describe('seed() 실패 시 롤백', () => {
  it('할일 INSERT가 실패하면 사용자·카테고리도 남지 않는다', async () => {
    await pool.query(
      `CREATE FUNCTION fail_trg() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'forced'; END$$`,
    );
    await pool.query(
      'CREATE TRIGGER t BEFORE INSERT ON todos FOR EACH ROW EXECUTE FUNCTION fail_trg()',
    );
    try {
      await expect(seed(args)).rejects.toThrow('forced');
      expect(await n('users')).toBe(0);
      expect(await n('categories')).toBe(0);
    } finally {
      await pool.query('DROP TRIGGER IF EXISTS t ON todos');
      await pool.query('DROP FUNCTION IF EXISTS fail_trg()');
    }
  });
});
