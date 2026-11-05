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
const post = (u, body) => request(app).post('/api/todos').set('Cookie', u.cookies).send(body);
const put = (u, id, body) =>
  request(app).put(`/api/todos/${id}`).set('Cookie', u.cookies).send(body);
const get = (u, id) => request(app).get(`/api/todos/${id}`).set('Cookie', u.cookies);
const valid = (o = {}) => ({ title: '할일', startDate: '2026-11-04', endDate: '2026-11-06', ...o });
const memoInDb = async (id) => (await query('SELECT memo FROM todos WHERE id = $1', [id]))[0].memo;

describe('memo (BE-16)', () => {
  it('POST 1000자 허용, 단건·목록 재조회 동일', async () => {
    const u = await authed(app);
    const memo = '가'.repeat(1000);
    const res = await post(u, valid({ memo }));
    expect(res.status).toBe(201);
    expect(res.body.memo).toBe(memo);
    expect((await get(u, res.body.id)).body.memo).toBe(memo);
    const list = await request(app)
      .get('/api/todos')
      .query({ today: '2026-11-04' })
      .set('Cookie', u.cookies);
    expect(list.body.items[0].memo).toBe(memo);
  });

  it('POST 1001자는 400 fields.memo, 행 생성 없음', async () => {
    const u = await authed(app);
    const res = await post(u, valid({ memo: 'a'.repeat(1001) }));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields).toHaveProperty('memo');
    expect(await query('SELECT 1 FROM todos')).toHaveLength(0);
  });

  it.each([
    ['생략', {}],
    ['빈 문자열', { memo: '' }],
  ])('POST memo %s → DB NULL, 응답 null', async (_n, o) => {
    const u = await authed(app);
    const res = await post(u, valid(o));
    expect(res.status).toBe(201);
    expect(res.body.memo).toBeNull();
    expect(await memoInDb(res.body.id)).toBeNull();
    expect((await get(u, res.body.id)).body.memo).toBeNull();
  });

  it('PUT 1000자 허용, 1001자 400(불변), 생략·빈 문자열은 NULL(전체 교체)', async () => {
    const u = await authed(app);
    const { id } = (await post(u, valid({ memo: '처음' }))).body;
    const body = (o) => valid({ isCompleted: false, ...o });

    const okMemo = 'b'.repeat(1000);
    const ok = await put(u, id, body({ memo: okMemo }));
    expect(ok.status).toBe(200);
    expect((await get(u, id)).body.memo).toBe(okMemo);

    const bad = await put(u, id, body({ memo: 'b'.repeat(1001) }));
    expect(bad.status).toBe(400);
    expect(bad.body.error.fields).toHaveProperty('memo');
    expect(await memoInDb(id)).toBe(okMemo);

    expect((await put(u, id, body({}))).body.memo).toBeNull();
    expect(await memoInDb(id)).toBeNull();
    await put(u, id, body({ memo: '다시' }));
    expect((await put(u, id, body({ memo: '' }))).status).toBe(200);
    expect(await memoInDb(id)).toBeNull();
  });
});
