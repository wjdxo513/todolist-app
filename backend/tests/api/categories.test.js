import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { pool } from '../../src/db/pool.js';
import { query } from '../../src/db/query.js';
import { loginAttempts } from '../../src/lib/loginAttempts.js';
import { authed } from '../helpers/auth.js';

afterAll(() => pool.end());
beforeEach(() => loginAttempts.clear());

const app = createApp();
const list = (u) => request(app).get('/api/categories').set('Cookie', u.cookies);
const create = (u, name) =>
  request(app).post('/api/categories').set('Cookie', u.cookies).send({ name });
const rename = (u, id, name) =>
  request(app).patch(`/api/categories/${id}`).set('Cookie', u.cookies).send({ name });
const remove = (u, id) => request(app).delete(`/api/categories/${id}`).set('Cookie', u.cookies);
const defaultId = async (u) => (await list(u)).body.items.find((c) => c.isDefault).id;
const addTodo = (userId, categoryId, title) =>
  query(
    `INSERT INTO todos (user_id, category_id, title, start_date, end_date)
     VALUES ($1, $2, $3, '2026-11-01', '2026-11-02')`,
    [userId, categoryId, title],
  );
const todoCats = async () =>
  (await query('SELECT title, category_id FROM todos ORDER BY id')).map((r) => r.categoryId);

describe('GET/POST /api/categories (BE-09)', () => {
  it('목록은 본인 것만, 기본에 isDefault 표시', async () => {
    const a = await authed(app);
    const b = await authed(app);
    await create(a, '운동');
    await create(b, '타인것');
    const res = await list(a);
    expect(res.status).toBe(200);
    expect(res.body.items.map((c) => [c.name, c.isDefault]).sort()).toEqual(
      [
        ['기본', true],
        ['운동', false],
      ].sort(),
    );
  });

  it('이름 1·20자 허용, 21자·빈 값 400', async () => {
    const u = await authed(app);
    expect((await create(u, 'a')).status).toBe(201);
    const ok = await create(u, 'b'.repeat(20));
    expect(ok.status).toBe(201);
    expect(ok.body).toEqual({ id: expect.any(Number), name: 'b'.repeat(20), isDefault: false });
    for (const name of ['c'.repeat(21), '']) {
      const res = await create(u, name);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.fields).toHaveProperty('name');
    }
  });

  it('같은 사용자 내 중복 409, 다른 사용자는 허용', async () => {
    const a = await authed(app);
    const b = await authed(app);
    await create(a, '운동');
    const dup = await create(a, '운동');
    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe('CATEGORY_NAME_DUPLICATE');
    expect((await create(b, '운동')).status).toBe(201);
  });
});

describe('기본 카테고리 보호 (BR-08)', () => {
  it('이름 수정·삭제는 409 DEFAULT_CATEGORY_PROTECTED, 데이터 불변', async () => {
    const u = await authed(app);
    const id = await defaultId(u);
    const r1 = await rename(u, id, '바꿈');
    const r2 = await remove(u, id);
    for (const r of [r1, r2]) {
      expect(r.status).toBe(409);
      expect(r.body.error.code).toBe('DEFAULT_CATEGORY_PROTECTED');
    }
    expect((await list(u)).body.items).toEqual([{ id, name: '기본', isDefault: true }]);
  });
});

describe('PATCH/DELETE 정상 동작', () => {
  it('이름 수정 200', async () => {
    const u = await authed(app);
    const { id } = (await create(u, '운동')).body;
    const res = await rename(u, id, '헬스');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id, name: '헬스', isDefault: false });
  });

  it('할일 2건 소속 카테고리 삭제 시 204, 할일은 기본 카테고리로 이동, 총수 불변', async () => {
    const u = await authed(app);
    const def = await defaultId(u);
    const { id } = (await create(u, '운동')).body;
    await addTodo(u.id, id, 't1');
    await addTodo(u.id, id, 't2');
    const res = await remove(u, id);
    expect(res.status).toBe(204);
    expect(await todoCats()).toEqual([def, def]);
    expect((await list(u)).body.items).toHaveLength(1);
  });

  it('마지막 DELETE 실패 시 할일 이동도 롤백(500)', async () => {
    const u = await authed(app);
    const def = await defaultId(u);
    const { id } = (await create(u, '운동')).body;
    await addTodo(u.id, id, 't1');
    await pool.query(
      `CREATE FUNCTION fail_trg() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'forced'; END$$`,
    );
    await pool.query(
      'CREATE TRIGGER t BEFORE DELETE ON categories FOR EACH ROW EXECUTE FUNCTION fail_trg()',
    );
    try {
      const res = await remove(u, id);
      expect(res.status).toBe(500);
      expect(await todoCats()).toEqual([id]);
      expect(def).not.toBe(id);
    } finally {
      await pool.query('DROP TRIGGER IF EXISTS t ON categories');
      await pool.query('DROP FUNCTION IF EXISTS fail_trg()');
    }
  });
});

async function withTrigger(timing, body, fn) {
  await pool.query(
    `CREATE FUNCTION test_trg() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN ${body} END$$`,
  );
  await pool.query(
    `CREATE TRIGGER t ${timing} ON categories FOR EACH ROW EXECUTE FUNCTION test_trg()`,
  );
  try {
    await fn();
  } finally {
    await pool.query('DROP TRIGGER IF EXISTS t ON categories');
    await pool.query('DROP FUNCTION IF EXISTS test_trg()');
  }
}

describe('동시 변경·예외 경로', () => {
  it('삭제 직전 다른 요청이 할일을 붙이면(23503) 409 CATEGORY_IN_USE, 변경 없음', async () => {
    const u = await authed(app);
    const { id } = (await create(u, '운동')).body;
    // DELETE 직전에 같은 카테고리로 할일이 생기는 경쟁 상황을 트리거로 재현
    await withTrigger(
      'BEFORE DELETE',
      `INSERT INTO todos (user_id, category_id, title, start_date, end_date)
         VALUES (OLD.user_id, OLD.id, 'race', '2026-11-01', '2026-11-01'); RETURN OLD;`,
      async () => {
        const res = await remove(u, id);
        expect(res.status).toBe(409);
        expect(res.body.error.code).toBe('CATEGORY_IN_USE');
      },
    );
    expect((await list(u)).body.items.map((c) => c.id)).toContain(id);
    expect(await todoCats()).toEqual([]);
  });

  it('조회 후 삭제 전에 행이 사라지면 404', async () => {
    const u = await authed(app);
    const { id } = (await create(u, '운동')).body;
    await withTrigger('BEFORE DELETE', 'RETURN NULL;', async () => {
      expect((await remove(u, id)).status).toBe(404);
    });
  });

  it('조회 후 수정 전에 행이 사라지면 404', async () => {
    const u = await authed(app);
    const { id } = (await create(u, '운동')).body;
    await withTrigger('BEFORE UPDATE', 'RETURN NULL;', async () => {
      expect((await rename(u, id, '헬스')).status).toBe(404);
    });
  });

  it('중복 외의 DB 오류는 등록·수정 모두 500', async () => {
    const u = await authed(app);
    const { id } = (await create(u, '운동')).body;
    await withTrigger('BEFORE INSERT OR UPDATE', "RAISE EXCEPTION 'forced';", async () => {
      expect((await create(u, '공부')).status).toBe(500);
      expect((await rename(u, id, '헬스')).status).toBe(500);
    });
  });
});

describe('소유권·ID 형식 (NFR-06, TP-10, D-10)', () => {
  it('타인·없는 ID 수정·삭제는 본문 동일한 404, 타인 데이터 불변', async () => {
    const a = await authed(app);
    const b = await authed(app);
    const { id: otherId } = (await create(b, '타인것')).body;
    const missing = 999999;

    const r = {
      otherPatch: await rename(a, otherId, '탈취'),
      missingPatch: await rename(a, missing, '탈취'),
      otherDel: await remove(a, otherId),
      missingDel: await remove(a, missing),
    };
    for (const x of Object.values(r)) expect(x.status).toBe(404);
    expect(r.otherPatch.body).toEqual(r.missingPatch.body);
    expect(r.otherDel.body).toEqual(r.missingDel.body);
    expect(r.otherPatch.body).toEqual(r.otherDel.body);
    expect((await list(b)).body.items.find((c) => c.id === otherId)).toEqual({
      id: otherId,
      name: '타인것',
      isDefault: false,
    });
  });

  it('경로 ID 형식 오류(abc)는 404', async () => {
    const u = await authed(app);
    expect((await rename(u, 'abc', 'x')).status).toBe(404);
    expect((await remove(u, 'abc')).status).toBe(404);
  });
});
