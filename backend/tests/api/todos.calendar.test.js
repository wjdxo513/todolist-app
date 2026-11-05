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
const cal = (u, q) => request(app).get('/api/todos/calendar').query(q).set('Cookie', u.cookies);
const insert = async (u, title, start, end, done = false) =>
  query(
    `INSERT INTO todos (user_id, category_id, title, start_date, end_date, is_completed)
     SELECT $1, id, $2, $3, $4, $5 FROM categories WHERE user_id = $1 AND is_default`,
    [u.id, title, start, end, done],
  );
const titles = (res) => res.body.items.map((t) => t.title).sort();

describe('GET /api/todos/calendar (BE-14)', () => {
  it('SN-12: 월·주·일 범위와 겹치는 할일 (CV-01~05)', async () => {
    const u = await authed(app);
    await insert(u, 'A', '2026-11-02', '2026-11-04');
    await insert(u, 'B', '2026-11-06', '2026-11-10');
    await insert(u, 'C', '2026-10-28', '2026-11-03');
    const today = '2026-11-04';
    const month = await cal(u, { from: '2026-11-01', to: '2026-11-30', today });
    expect(month.status).toBe(200);
    expect(titles(month)).toEqual(['A', 'B', 'C']);
    expect(titles(await cal(u, { from: '2026-11-01', to: '2026-11-07', today }))).toEqual([
      'A',
      'B',
      'C',
    ]);
    expect(titles(await cal(u, { from: '2026-11-04', to: '2026-11-04', today }))).toEqual(['A']);
  });

  it('항목에 status 포함(완료 포함), 타 사용자 제외', async () => {
    const a = await authed(app);
    const b = await authed(app);
    await insert(a, 'done', '2026-11-02', '2026-11-04', true);
    await insert(a, 'open', '2026-11-05', '2026-11-06');
    await insert(b, 'other', '2026-11-02', '2026-11-04');
    const res = await cal(a, { from: '2026-11-01', to: '2026-11-30', today: '2026-11-04' });
    expect(Object.keys(res.body)).toEqual(['items']);
    const st = Object.fromEntries(res.body.items.map((t) => [t.title, t.status]));
    expect(st).toEqual({ done: '완료', open: '시작 전' });
  });

  it('41일 차이 허용, 42일 차이 거부', async () => {
    const u = await authed(app);
    const today = '2026-11-04';
    expect((await cal(u, { from: '2026-11-01', to: '2026-12-12', today })).status).toBe(200);
    const res = await cal(u, { from: '2026-11-01', to: '2026-12-13', today });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it.each([
    ['from>to', { from: '2026-11-05', to: '2026-11-04', today: '2026-11-04' }],
    ['from 형식 오류', { from: '2026/11/01', to: '2026-11-04', today: '2026-11-04' }],
    ['to 없는 날짜', { from: '2026-11-01', to: '2026-02-30', today: '2026-11-04' }],
    ['today 누락', { from: '2026-11-01', to: '2026-11-04' }],
    ['from 누락', { to: '2026-11-04', today: '2026-11-04' }],
  ])('%s은 400', async (_n, q) => {
    const u = await authed(app);
    expect((await cal(u, q)).status).toBe(400);
  });

  it('결과 상한 없음: 60건 모두 반환', async () => {
    const u = await authed(app);
    await query(
      `INSERT INTO todos (user_id, category_id, title, start_date, end_date)
       SELECT $1, (SELECT id FROM categories WHERE user_id = $1 AND is_default), 't' || g,
              '2026-11-10', '2026-11-12' FROM generate_series(1, 60) g`,
      [u.id],
    );
    const res = await cal(u, { from: '2026-11-01', to: '2026-11-30', today: '2026-11-04' });
    expect(res.body.items).toHaveLength(60);
  });

  it('미인증은 401', async () => {
    const res = await request(app)
      .get('/api/todos/calendar')
      .query({ from: '2026-11-01', to: '2026-11-02', today: '2026-11-01' });
    expect(res.status).toBe(401);
  });
});
