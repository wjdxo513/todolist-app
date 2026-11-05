import request from 'supertest';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app.js';
import { pool } from '../../src/db/pool.js';
import { query } from '../../src/db/query.js';
import { loginAttempts } from '../../src/lib/loginAttempts.js';
import { authed } from '../helpers/auth.js';

afterAll(() => pool.end());
beforeEach(() => loginAttempts.clear());
afterEach(() => vi.useRealTimers());

const app = createApp();
const TODAY = '2026-11-04';
const list = (u, q) => request(app).get('/api/todos').query(q).set('Cookie', u.cookies);
const rawList = (u, qs) => request(app).get(`/api/todos?${qs}`).set('Cookie', u.cookies);
const enc = encodeURIComponent;
const defaultCat = async (u) =>
  (await query('SELECT id FROM categories WHERE user_id = $1 AND is_default', [u.id]))[0].id;
const insert = async (u, title, start, end, done = false, cat) =>
  (
    await query(
      `INSERT INTO todos (user_id, category_id, title, start_date, end_date, is_completed)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [u.id, cat ?? (await defaultCat(u)), title, start, end, done],
    )
  )[0].id;

describe('GET /api/todos (BE-13)', () => {
  it('응답 형태와 today 기준 status, 타 사용자 제외', async () => {
    const a = await authed(app);
    const b = await authed(app);
    await insert(a, 's', '2026-11-05', '2026-11-07');
    await insert(a, 'p', '2026-11-04', '2026-11-06');
    await insert(a, 'd', '2026-11-10', '2026-11-12', true);
    await insert(a, 'o', '2026-11-01', '2026-11-03');
    await insert(b, 'other', '2026-11-04', '2026-11-06');
    const res = await list(a, { today: TODAY });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ page: 1, pageSize: 50, totalCount: 4 });
    expect(res.body.items).toHaveLength(4);
    expect(res.body.items[0]).toEqual({
      id: expect.any(Number),
      categoryId: expect.any(Number),
      title: expect.any(String),
      memo: null,
      startDate: expect.any(String),
      endDate: expect.any(String),
      isCompleted: expect.any(Boolean),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      status: expect.any(String),
    });
    const st = Object.fromEntries(res.body.items.map((t) => [t.title, t.status]));
    expect(st).toEqual({ s: '시작 전', p: '진행중', d: '완료', o: '기한 초과' });
  });

  it.each([
    ['today 누락', {}],
    ['today 달력상 없는 날짜', { today: '2026-02-30' }],
    ['today 형식 오류', { today: '20261104' }],
  ])('%s은 400', async (_n, q) => {
    const u = await authed(app);
    const res = await list(u, q);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it.each(['시작 전', '진행중', '완료', '기한 초과'])('status=%s 필터', async (status) => {
    const u = await authed(app);
    await insert(u, 's', '2026-11-05', '2026-11-07');
    await insert(u, 'p', '2026-11-04', '2026-11-06');
    await insert(u, 'd', '2026-11-10', '2026-11-12', true);
    await insert(u, 'o', '2026-11-01', '2026-11-03');
    const res = await list(u, { today: TODAY, status });
    expect(res.status).toBe(200);
    expect(res.body.totalCount).toBe(1);
    expect(res.body.items.map((t) => t.status)).toEqual([status]);
  });

  // 3번 문서 4장 A표(2026-11). ST-10~12는 완료·해제 두 시점을 모두 넣는다.
  const ST = [
    ['ST-01', 5, 7, 4, false, '시작 전'],
    ['ST-02', 4, 6, 4, false, '진행중'],
    ['ST-03', 3, 6, 4, false, '진행중'],
    ['ST-04', 2, 4, 4, false, '진행중'],
    ['ST-05', 4, 4, 4, false, '진행중'],
    ['ST-06', 5, 5, 4, false, '시작 전'],
    ['ST-07', 2, 4, 5, false, '기한 초과'],
    ['ST-08', 10, 12, 4, true, '완료'],
    ['ST-09', 3, 3, 4, false, '기한 초과'],
    ['ST-10 완료', 1, 3, 4, true, '완료'],
    ['ST-10 해제', 1, 3, 4, false, '기한 초과'],
    ['ST-11 완료', 10, 12, 4, true, '완료'],
    ['ST-11 해제', 10, 12, 4, false, '시작 전'],
    ['ST-12 완료', 3, 6, 4, true, '완료'],
    ['ST-12 해제', 3, 6, 4, false, '진행중'],
    ['ST-13', 1, 3, 10, true, '완료'],
  ];
  const d = (n) => `2026-11-${String(n).padStart(2, '0')}`;

  it('ST fixture: 상태 필터 결과가 status와 일치하고 모든 할일이 정확히 한 필터에 나타난다 (TP-02)', async () => {
    const u = await authed(app);
    for (const today of [...new Set(ST.map((r) => r[3]))]) {
      await query('DELETE FROM todos WHERE user_id = $1', [u.id]);
      const rows = ST.filter((r) => r[3] === today);
      for (const [title, s0, e0, , done] of rows) await insert(u, title, d(s0), d(e0), done);
      const seen = {};
      for (const status of ['시작 전', '진행중', '완료', '기한 초과']) {
        const res = await list(u, { today: d(today), status });
        for (const t of res.body.items) {
          expect(t.status).toBe(status);
          seen[t.title] = (seen[t.title] ?? 0) + 1;
        }
      }
      for (const [title, , , , , expected] of rows) {
        expect(seen[title], title).toBe(1);
        const all = (await list(u, { today: d(today) })).body.items;
        expect(all.find((t) => t.title === title).status, title).toBe(expected);
      }
    }
  });

  it('상태 필터와 카테고리 필터는 AND로 적용된다 (AS-06)', async () => {
    const u = await authed(app);
    const [{ id: c2 }] = await query(
      "INSERT INTO categories (user_id, name) VALUES ($1, '운동') RETURNING id",
      [u.id],
    );
    await insert(u, 'default-progress', '2026-11-04', '2026-11-05');
    await insert(u, 'c2-progress', '2026-11-04', '2026-11-05', false, c2);
    await insert(u, 'c2-done', '2026-11-04', '2026-11-05', true, c2);
    const res = await list(u, { today: TODAY, status: '진행중', categoryId: c2 });
    expect(res.body.items.map((t) => t.title)).toEqual(['c2-progress']);
    expect(res.body.totalCount).toBe(1);
  });

  it('status 중복 키·잘못된 값은 400', async () => {
    const u = await authed(app);
    const dup = await rawList(u, `today=${TODAY}&status=${enc('시작 전')}&status=${enc('완료')}`);
    expect(dup.status).toBe(400);
    expect((await list(u, { today: TODAY, status: 'DONE' })).status).toBe(400);
  });

  it('categoryId 필터, 없는·타인 카테고리는 같은 404', async () => {
    const a = await authed(app);
    const b = await authed(app);
    const [{ id: c2 }] = await query(
      "INSERT INTO categories (user_id, name) VALUES ($1, '운동') RETURNING id",
      [a.id],
    );
    await insert(a, 'in-default', '2026-11-04', '2026-11-05');
    await insert(a, 'in-c2', '2026-11-04', '2026-11-05', false, c2);
    const ok = await list(a, { today: TODAY, categoryId: c2 });
    expect(ok.body.items.map((t) => t.title)).toEqual(['in-c2']);
    const r1 = await list(a, { today: TODAY, categoryId: await defaultCat(b) });
    const r2 = await list(a, { today: TODAY, categoryId: 999999 });
    expect(r1.status).toBe(404);
    expect(r1.body.error.code).toBe('NOT_FOUND');
    expect(r2.status).toBe(404);
    expect(r2.body).toEqual(r1.body);
  });

  it('정렬: end_date, created_at, id 오름차순', async () => {
    const u = await authed(app);
    const t3 = await insert(u, 'late', '2026-11-01', '2026-11-09');
    const t1 = await insert(u, 'early-a', '2026-11-01', '2026-11-05');
    const t2 = await insert(u, 'early-b', '2026-11-01', '2026-11-05');
    await query("UPDATE todos SET created_at = '2026-01-01'");
    await query("UPDATE todos SET created_at = '2025-01-01' WHERE id = $1", [t2]);
    const res = await list(u, { today: TODAY });
    expect(res.body.items.map((t) => t.id)).toEqual([t2, t1, t3]);
  });

  it('120건(같은 end_date·created_at): 페이지 50/50/20, 중복·누락 없음, 범위 밖 page는 빈 items', async () => {
    const u = await authed(app);
    await query(
      `INSERT INTO todos (user_id, category_id, title, start_date, end_date, created_at)
       SELECT $1, $2, 't' || g, '2026-11-01', '2026-11-30', '2026-01-01' FROM generate_series(1, 120) g`,
      [u.id, await defaultCat(u)],
    );
    const ids = [];
    const sizes = [];
    for (const page of [1, 2, 3]) {
      const res = await list(u, { today: TODAY, page });
      expect(res.body).toMatchObject({ page, pageSize: 50, totalCount: 120 });
      sizes.push(res.body.items.length);
      ids.push(...res.body.items.map((t) => t.id));
    }
    expect(sizes).toEqual([50, 50, 20]);
    expect(new Set(ids).size).toBe(120);
    expect(ids).toEqual([...ids].sort((x, y) => x - y));
    const over = await list(u, { today: TODAY, page: 4 });
    expect(over.status).toBe(200);
    expect(over.body.items).toEqual([]);
    expect(over.body.totalCount).toBe(120);
  });

  it('서버 시계와 무관하게 요청 today로 판정', async () => {
    // 서버 시계를 먼 미래로 둔 상태에서 로그인해야 Access Token(15분)이 그 시계 기준으로 유효하다
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2030-01-01T00:00:00Z'));
    const u = await authed(app);
    await insert(u, 'x', '2026-11-04', '2026-11-06');
    const after = (await list(u, { today: TODAY })).body.items.map((t) => t.status);
    vi.useRealTimers();
    const before = (await list(u, { today: TODAY })).body.items.map((t) => t.status);
    expect(before).toEqual(['진행중']);
    expect(after).toEqual(before);
    expect((await list(u, { today: '2026-11-07' })).body.items[0].status).toBe('기한 초과');
  });

  it('미인증은 401', async () => {
    expect((await request(app).get('/api/todos').query({ today: TODAY })).status).toBe(401);
  });
});
