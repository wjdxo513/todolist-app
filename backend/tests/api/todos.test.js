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
const withCookie = (r, u) => (u ? r.set('Cookie', u.cookies) : r);
const post = (u, body) => withCookie(request(app).post('/api/todos'), u).send(body);
const get = (u, id) => withCookie(request(app).get(`/api/todos/${id}`), u);
const put = (u, id, body) => withCookie(request(app).put(`/api/todos/${id}`), u).send(body);
const complete = (u, id, isCompleted) =>
  withCookie(request(app).patch(`/api/todos/${id}/completion`), u).send({ isCompleted });
const del = (u, id) => withCookie(request(app).delete(`/api/todos/${id}`), u);
const createCategory = async (u, name) =>
  (await request(app).post('/api/categories').set('Cookie', u.cookies).send({ name })).body.id;
const defaultId = async (u) =>
  (await request(app).get('/api/categories').set('Cookie', u.cookies)).body.items.find(
    (c) => c.isDefault,
  ).id;
const count = async () => (await query('SELECT count(*) AS n FROM todos'))[0].n;

const valid = (o = {}) => ({ title: '할일', startDate: '2026-11-04', endDate: '2026-11-06', ...o });
const validPut = (o = {}) => valid({ isCompleted: false, ...o });
const make = async (u, o) => (await post(u, valid(o))).body;

describe('POST /api/todos (BE-11)', () => {
  it('201, 응답 필드, 기본 카테고리, isCompleted false', async () => {
    const u = await authed(app);
    const res = await post(u, valid());
    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: expect.any(Number),
      categoryId: await defaultId(u),
      title: '할일',
      memo: null,
      startDate: '2026-11-04',
      endDate: '2026-11-06',
      isCompleted: false,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
    expect(res.body).not.toHaveProperty('status');
  });

  it('categoryId null도 기본 카테고리, 지정하면 그 카테고리', async () => {
    const u = await authed(app);
    expect((await post(u, valid({ categoryId: null }))).body.categoryId).toBe(await defaultId(u));
    const cid = await createCategory(u, '운동');
    expect((await post(u, valid({ categoryId: cid }))).body.categoryId).toBe(cid);
  });

  it('시작=종료 201, 역전 400 + fields.endDate', async () => {
    const u = await authed(app);
    expect((await post(u, valid({ endDate: '2026-11-04' }))).status).toBe(201);
    const before = await count();
    const res = await post(u, valid({ startDate: '2026-11-05', endDate: '2026-11-04' }));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields).toHaveProperty('endDate');
    expect(await count()).toBe(before);
  });

  it('제목 100자 허용', async () => {
    const u = await authed(app);
    expect((await post(u, valid({ title: 'a'.repeat(100) }))).status).toBe(201);
  });

  it.each([
    ['제목 누락', { title: undefined }],
    ['시작일 누락', { startDate: undefined }],
    ['종료일 누락', { endDate: undefined }],
    ['제목 빈 값', { title: '' }],
    ['제목 101자', { title: 'a'.repeat(101) }],
    ['달력상 없는 날짜', { endDate: '2026-02-30' }],
  ])('%s은 400이고 행 수 불변', async (_n, o) => {
    const u = await authed(app);
    const res = await post(u, valid(o));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(await count()).toBe(0);
  });

  it('타인 카테고리는 없는 ID와 같은 404, 행 수 불변', async () => {
    const a = await authed(app);
    const b = await authed(app);
    const bCat = await createCategory(b, '타인것');
    const r1 = await post(a, valid({ categoryId: bCat }));
    const r2 = await post(a, valid({ categoryId: 999999 }));
    expect(r1.status).toBe(404);
    expect(r1.body.error.code).toBe('NOT_FOUND');
    expect(r1.body).toEqual(r2.body);
    expect(r2.status).toBe(404);
    expect(await count()).toBe(0);
  });

  it('본문 userId는 무시되고 본인 소유', async () => {
    const a = await authed(app);
    const b = await authed(app);
    const { id } = (await post(a, { ...valid(), userId: b.id })).body;
    const [row] = await query('SELECT user_id FROM todos WHERE id = $1', [id]);
    expect(row.userId).toBe(a.id);
  });

  it('카테고리 조회와 INSERT 사이 카테고리 삭제(FK 23503)는 404', async () => {
    const u = await authed(app);
    const cid = await createCategory(u, '곧삭제');
    await query(`CREATE FUNCTION race_del_cat() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN DELETE FROM categories WHERE id = NEW.category_id; RETURN NEW; END $$`);
    await query(
      'CREATE TRIGGER race_del_cat BEFORE INSERT ON todos FOR EACH ROW EXECUTE FUNCTION race_del_cat()',
    );
    try {
      const res = await post(u, valid({ categoryId: cid }));
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    } finally {
      await query('DROP TRIGGER race_del_cat ON todos');
      await query('DROP FUNCTION race_del_cat()');
    }
    expect(await count()).toBe(0);
  });
});

describe('GET /api/todos/:id (BE-11)', () => {
  it('본인 200, 타인·없는 ID·형식 오류는 같은 404', async () => {
    const a = await authed(app);
    const b = await authed(app);
    const t = await make(a);
    const ok = await get(a, t.id);
    expect(ok.status).toBe(200);
    expect(ok.body).toEqual(t);
    const others = [await get(b, t.id), await get(a, 999999), await get(a, 'abc')];
    for (const r of others) {
      expect(r.status).toBe(404);
      expect(r.body).toEqual(others[0].body);
    }
    expect(others[0].body.error.code).toBe('NOT_FOUND');
  });

  it.each(['2026-01-31', '2026-02-28', '2024-02-29', '2026-12-31'])(
    '경계 날짜 %s 저장→조회 동일',
    async (day) => {
      const u = await authed(app);
      const t = await make(u, { startDate: day, endDate: day });
      expect(t.startDate).toBe(day);
      const got = (await get(u, t.id)).body;
      expect(got.startDate).toBe(day);
      expect(got.endDate).toBe(day);
    },
  );
});

describe('인증', () => {
  it('미인증은 401', async () => {
    const rs = [
      await post(null, valid()),
      await get(null, 1),
      await put(null, 1, validPut()),
      await complete(null, 1, true),
      await del(null, 1),
    ];
    for (const r of rs) expect(r.status).toBe(401);
  });
});

describe('PUT /api/todos/:id (BE-12)', () => {
  it('필드 변경이 유지되고 updated_at 증가', async () => {
    const u = await authed(app);
    const t = await make(u);
    const cid = await createCategory(u, '운동');
    await query("UPDATE todos SET updated_at = now() - interval '1 minute'");
    const [{ updatedAt: old }] = await query('SELECT updated_at FROM todos WHERE id = $1', [t.id]);
    const res = await put(u, t.id, {
      title: '수정',
      categoryId: cid,
      startDate: '2026-12-01',
      endDate: '2026-12-02',
      isCompleted: true,
    });
    expect(res.status).toBe(200);
    const got = (await get(u, t.id)).body;
    expect(got).toMatchObject({
      title: '수정',
      categoryId: cid,
      startDate: '2026-12-01',
      endDate: '2026-12-02',
      isCompleted: true,
    });
    const [{ updatedAt }] = await query('SELECT updated_at FROM todos WHERE id = $1', [t.id]);
    expect(updatedAt.getTime()).toBeGreaterThan(old.getTime());
  });

  it.each([
    ['기간 역전', { startDate: '2026-11-07', endDate: '2026-11-06' }],
    ['제목 비움', { title: '' }],
    ['제목 길이 초과', { title: 'a'.repeat(101) }],
    ['종료일 누락', { endDate: undefined }],
  ])('%s은 400이고 기존 값 불변', async (_n, o) => {
    const u = await authed(app);
    const t = await make(u);
    const res = await put(u, t.id, validPut(o));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect((await get(u, t.id)).body).toEqual(t);
  });

  it('categoryId null이면 기본 카테고리', async () => {
    const u = await authed(app);
    const cid = await createCategory(u, '운동');
    const t = await make(u, { categoryId: cid });
    const res = await put(u, t.id, validPut({ categoryId: null }));
    expect(res.status).toBe(200);
    expect(res.body.categoryId).toBe(await defaultId(u));
  });

  it('타인 카테고리 지정은 404이고 불변', async () => {
    const a = await authed(app);
    const b = await authed(app);
    const t = await make(a);
    const bCat = await createCategory(b, '타인것');
    const res = await put(a, t.id, validPut({ categoryId: bCat, title: '바꿈' }));
    expect(res.status).toBe(404);
    expect((await get(a, t.id)).body).toEqual(t);
  });
});

describe('PATCH /api/todos/:id/completion (BE-12)', () => {
  it('true/false 반영', async () => {
    const u = await authed(app);
    const t = await make(u);
    const r1 = await complete(u, t.id, true);
    expect(r1.status).toBe(200);
    expect(r1.body.isCompleted).toBe(true);
    expect((await get(u, t.id)).body.isCompleted).toBe(true);
    const r2 = await complete(u, t.id, false);
    expect(r2.status).toBe(200);
    expect((await get(u, t.id)).body.isCompleted).toBe(false);
  });
});

describe('DELETE /api/todos/:id (BE-12)', () => {
  it('204, 이후 단건 404, 총수 -1', async () => {
    const u = await authed(app);
    const t = await make(u);
    await make(u);
    const before = await count();
    expect((await del(u, t.id)).status).toBe(204);
    expect((await get(u, t.id)).status).toBe(404);
    expect(await count()).toBe(before - 1);
  });
});

describe('타인·없는 ID의 수정·완료·삭제 (SN-13)', () => {
  it('같은 404이고 타인 데이터 불변', async () => {
    const a = await authed(app);
    const b = await authed(app);
    const t = await make(a);
    const before = await count();
    const rs = [
      await put(b, t.id, validPut({ title: '탈취' })),
      await complete(b, t.id, true),
      await del(b, t.id),
      await put(b, 999999, validPut()),
      await complete(b, 999999, true),
      await del(b, 999999),
    ];
    for (const r of rs) {
      expect(r.status).toBe(404);
      expect(r.body).toEqual(rs[0].body);
    }
    expect(rs[0].body.error.code).toBe('NOT_FOUND');
    expect((await get(a, t.id)).body).toEqual(t);
    expect(await count()).toBe(before);
  });
});
