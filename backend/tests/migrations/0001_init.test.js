import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { migrate } from '../../scripts/migrate.js';
import { connect, getTestDbUrl, resetDb } from '../helpers/testDb.js';

const schemaSql = readFileSync(fileURLToPath(new URL('../../../docs/schema.sql', import.meta.url)), 'utf8');
let client;

const q = async (sql, params) => (await client.query(sql, params)).rows;
// 실패 기대 문장은 autocommit 단일 문장으로 실행해 트랜잭션 오염을 피한다.
const codeOf = async (sql, params) => {
  try {
    await client.query(sql, params);
  } catch (e) {
    return e.code;
  }
  return null;
};

const newUser = async (email) =>
  (await q("INSERT INTO users (email, password_hash, name) VALUES ($1, 'h', 'n') RETURNING id", [email]))[0].id;
const newCat = async (userId, name, isDefault = false) =>
  (await q('INSERT INTO categories (user_id, name, is_default) VALUES ($1, $2, $3) RETURNING id', [userId, name, isDefault]))[0].id;
const todoSql =
  'INSERT INTO todos (user_id, category_id, title, memo, start_date, end_date) VALUES ($1, $2, $3, $4, $5, $6)';
const tokenSql =
  "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, now() + interval '7 days')";

beforeAll(async () => {
  client = await connect();
  await resetDb(client);
  await migrate({ connectionString: getTestDbUrl() });
});
afterAll(async () => {
  await client.end();
});

describe('0001_init 적용 결과', () => {
  it('테이블 5개 존재', async () => {
    const rows = await q("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
    expect(rows.map((r) => r.tablename).sort()).toEqual([
      'categories',
      'refresh_tokens',
      'schema_migrations',
      'todos',
      'users',
    ]);
  });

  it('제약 10종·인덱스 4종 존재', async () => {
    const cons = (await q("SELECT conname FROM pg_constraint WHERE connamespace = 'public'::regnamespace")).map(
      (r) => r.conname,
    );
    expect(cons).toEqual(
      expect.arrayContaining([
        'uq_users_email',
        'ck_users_email_lower',
        'uq_categories_user_id_name',
        'uq_categories_id_user_id',
        'ck_todos_end_date_gte_start_date',
        'fk_categories_user_id',
        'fk_todos_user_id',
        'fk_todos_category_id_user_id',
        'uq_refresh_tokens_token_hash',
        'fk_refresh_tokens_user_id',
      ]),
    );
    const idx = (await q("SELECT indexname FROM pg_indexes WHERE schemaname = 'public'")).map((r) => r.indexname);
    expect(idx).toEqual(
      expect.arrayContaining([
        'uq_categories_user_id_default',
        'idx_todos_user_id_end_date_created_at_id',
        'idx_todos_user_id_category_id',
        'idx_refresh_tokens_user_id',
      ]),
    );
  });

  it('todos에 status 컬럼 없음 (BR-13)', async () => {
    const rows = await q(
      "SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'todos' AND column_name = 'status'",
    );
    expect(rows).toEqual([]);
  });
});

describe('docs/schema.sql 과 동치', () => {
  const snapshot = async (schema) => {
    await client.query(`SET search_path TO ${schema}`); // pg_get_constraintdef 출력이 search_path에 의존
    const columns = await q(
      `SELECT table_name, column_name, data_type, character_maximum_length, is_nullable, column_default, is_identity
         FROM information_schema.columns WHERE table_schema = $1 ORDER BY table_name, column_name`,
      [schema],
    );
    const constraints = await q(
      `SELECT c.conname, pg_get_constraintdef(c.oid) AS def FROM pg_constraint c
        WHERE c.connamespace = $1::regnamespace ORDER BY 1`,
      [schema],
    );
    const indexes = (await q('SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = $1 ORDER BY 1', [schema])).map(
      (r) => ({ ...r, indexdef: r.indexdef.replaceAll(`${schema}.`, 'SCHEMA.') }),
    );
    return { columns, constraints, indexes };
  };

  it('컬럼·제약·인덱스 정의가 같다', async () => {
    await client.query('CREATE SCHEMA schema_sql_ref');
    await client.query('SET search_path TO schema_sql_ref');
    await client.query(schemaSql);
    const ref = await snapshot('schema_sql_ref');
    const actual = await snapshot('public');
    await client.query('SET search_path TO public');
    expect(ref.columns.length).toBeGreaterThan(0);
    expect(actual).toEqual(ref);
  });
});

describe('제약 동작', () => {
  it('대문자 이메일 거부(23514), 중복 이메일 거부(23505)', async () => {
    expect(await codeOf("INSERT INTO users (email, password_hash, name) VALUES ('A@B.com', 'h', 'n')")).toBe('23514');
    await newUser('dup@example.com');
    expect(await codeOf("INSERT INTO users (email, password_hash, name) VALUES ('dup@example.com', 'h', 'n')")).toBe(
      '23505',
    );
  });

  it('같은 사용자 카테고리 이름 중복 거부(23505)', async () => {
    const u = await newUser('cat-dup@example.com');
    await newCat(u, '업무');
    expect(await codeOf('INSERT INTO categories (user_id, name) VALUES ($1, $2)', [u, '업무'])).toBe('23505');
  });

  it('사용자당 기본 카테고리 2개째 거부(23505)', async () => {
    const u = await newUser('default@example.com');
    await newCat(u, '기본1', true);
    expect(await codeOf('INSERT INTO categories (user_id, name, is_default) VALUES ($1, $2, true)', [u, '기본2'])).toBe(
      '23505',
    );
  });

  it('end_date < start_date 거부(23514), 같은 날 허용, memo NULL 허용', async () => {
    const u = await newUser('todo@example.com');
    const c = await newCat(u, '일반');
    expect(await codeOf(todoSql, [u, c, 't', null, '2026-01-02', '2026-01-01'])).toBe('23514');
    expect(await codeOf(todoSql, [u, c, 't', null, '2026-01-01', '2026-01-01'])).toBeNull();
  });

  it('타인 카테고리를 참조하는 todo INSERT 거부(23503)', async () => {
    const u1 = await newUser('owner@example.com');
    const u2 = await newUser('other@example.com');
    const c1 = await newCat(u1, '내것');
    expect(await codeOf(todoSql, [u2, c1, 't', null, '2026-01-01', '2026-01-01'])).toBe('23503');
  });

  it('todo가 있는 카테고리 DELETE 거부(23503)', async () => {
    const u = await newUser('del-cat@example.com');
    const c = await newCat(u, '삭제불가');
    await client.query(todoSql, [u, c, 't', null, '2026-01-01', '2026-01-01']);
    expect(await codeOf('DELETE FROM categories WHERE id = $1', [c])).toBe('23503');
  });

  it('중복 token_hash 거부(23505)', async () => {
    const u = await newUser('tok@example.com');
    await client.query(tokenSql, [u, 'a'.repeat(64)]);
    expect(await codeOf(tokenSql, [u, 'a'.repeat(64)])).toBe('23505');
  });

  it('없는 사용자를 참조하는 refresh_tokens INSERT 거부(23503)', async () => {
    expect(await codeOf(tokenSql, [999999, 'b'.repeat(64)])).toBe('23503');
  });

  it('refresh_tokens 행이 있는 사용자 DELETE 거부(23503)', async () => {
    const u = await newUser('del-user@example.com');
    await client.query(tokenSql, [u, 'c'.repeat(64)]);
    expect(await codeOf('DELETE FROM users WHERE id = $1', [u])).toBe('23503');
  });
});
