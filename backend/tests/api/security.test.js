// BE-15: 개별 Task에 흩어진 보안·검증 요구를 표 기반으로 한 번 더 확인한다.
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import request from 'supertest';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app.js';
import { pool } from '../../src/db/pool.js';
import { query } from '../../src/db/query.js';
import { logger } from '../../src/lib/logger.js';
import { loginAttempts } from '../../src/lib/loginAttempts.js';
import { authed, login, PW, signup } from '../helpers/auth.js';

afterAll(() => pool.end());
beforeEach(() => loginAttempts.clear());
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

const app = createApp();
const TODAY = '2026-11-04';
const LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
const spyLogs = () => LEVELS.map((l) => vi.spyOn(logger, l).mockImplementation(() => {}));
const logged = (spies) => JSON.stringify(spies.flatMap((s) => s.mock.calls));
const cookieValue = (cookies, name) =>
  cookies
    .find((c) => c.startsWith(`${name}=`))
    .split(';')[0]
    .slice(name.length + 1);

async function userWithData() {
  const u = await authed(app);
  const cat = (
    await request(app).post('/api/categories').set('Cookie', u.cookies).send({ name: '운동' })
  ).body;
  const todo = (
    await request(app)
      .post('/api/todos')
      .set('Cookie', u.cookies)
      .send({ title: 't', categoryId: cat.id, startDate: TODAY, endDate: TODAY })
  ).body;
  return { u, cat, todo };
}

const todoBody = { title: 'x', startDate: TODAY, endDate: TODAY, isCompleted: false };
// [이름, (agent, id) => 요청]
const ID_ROUTES = [
  ['GET todo', (r, id) => r.get(`/api/todos/${id}`)],
  ['PUT todo', (r, id) => r.put(`/api/todos/${id}`).send(todoBody)],
  [
    'PATCH completion',
    (r, id) => r.patch(`/api/todos/${id}/completion`).send({ isCompleted: true }),
  ],
  ['DELETE todo', (r, id) => r.delete(`/api/todos/${id}`)],
  ['PATCH category', (r, id) => r.patch(`/api/categories/${id}`).send({ name: '바꿈' })],
  ['DELETE category', (r, id) => r.delete(`/api/categories/${id}`)],
];

describe('소유권: 타인 ID·없는 ID는 같은 404 (TP-10, SN-13, NFR-06)', () => {
  it.each(ID_ROUTES)('%s', async (name, send) => {
    const owner = await userWithData();
    const attacker = await authed(app);
    const id = name.includes('category') ? owner.cat.id : owner.todo.id;
    const snapshot = async () => [
      await query('SELECT * FROM todos ORDER BY id'),
      await query('SELECT * FROM categories ORDER BY id'),
    ];
    const before = await snapshot();
    const r = request(app);
    const foreign = await send(r, id).set('Cookie', attacker.cookies);
    const missing = await send(r, 2147483647).set('Cookie', attacker.cookies);
    expect(foreign.status).toBe(404);
    expect(missing.status).toBe(404);
    expect(foreign.body).toEqual(missing.body);
    expect(foreign.body).toEqual({ error: { code: 'NOT_FOUND', message: '찾을 수 없습니다.' } });
    expect(await snapshot()).toEqual(before);
  });
});

describe('인증: 보호 라우트는 쿠키 없이 401 (SN-03, FR-02)', () => {
  const PROTECTED = [
    ['get', '/api/users/me'],
    ['patch', '/api/users/me'],
    ['put', '/api/users/me/password'],
    ['get', '/api/categories'],
    ['post', '/api/categories'],
    ['patch', '/api/categories/1'],
    ['delete', '/api/categories/1'],
    ['get', `/api/todos?today=${TODAY}`],
    ['get', `/api/todos/calendar?from=${TODAY}&to=${TODAY}&today=${TODAY}`],
    ['post', '/api/todos'],
    ['get', '/api/todos/1'],
    ['put', '/api/todos/1'],
    ['patch', '/api/todos/1/completion'],
    ['delete', '/api/todos/1'],
  ];
  it.each(PROTECTED)('%s %s', async (method, path) => {
    const res = await request(app)[method](path).send({});
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });
});

describe('응답·저장 값에 비밀 정보 없음 (TP-13, LP-06, SP-03, ER-13)', () => {
  it('가입·로그인·me·내 정보 응답에 passwordHash·password_hash 키가 없다', async () => {
    const { res: s, body } = await signup(app);
    const { res: l, cookies } = await login(app, body.email);
    const responses = [
      s,
      l,
      await request(app).get('/api/users/me').set('Cookie', cookies),
      await request(app).patch('/api/users/me').set('Cookie', cookies).send({ name: '새이름' }),
      await request(app).get('/api/categories').set('Cookie', cookies),
    ];
    for (const r of responses) {
      expect(r.status).toBeLessThan(300);
      expect(JSON.stringify(r.body)).not.toMatch(/password_?hash|"password"/i);
    }
  });

  it('NODE_ENV=production이면 로그인·갱신 쿠키 2종 모두 Secure', async () => {
    const { body } = await signup(app);
    vi.stubEnv('NODE_ENV', 'production');
    const { cookies } = await login(app, body.email);
    const refreshed = await request(app).post('/api/auth/refresh').set('Cookie', cookies);
    for (const set of [cookies, refreshed.headers['set-cookie']]) {
      for (const name of ['access_token', 'refresh_token']) {
        expect(set.find((c) => c.startsWith(`${name}=`))).toMatch(/;\s*Secure/i);
      }
    }
  });

  it('로그인·갱신 후 DB에는 토큰 원문이 없고 해시만 있으며, 로그에도 원문이 없다', async () => {
    const spies = spyLogs();
    const { body } = await signup(app);
    const { cookies } = await login(app, body.email);
    const raw1 = cookieValue(cookies, 'refresh_token');
    const refreshed = await request(app).post('/api/auth/refresh').set('Cookie', cookies);
    const raw2 = cookieValue(refreshed.headers['set-cookie'], 'refresh_token');
    const access = cookieValue(refreshed.headers['set-cookie'], 'access_token');
    const hashes = (await query('SELECT token_hash FROM refresh_tokens')).map((r) => r.tokenHash);
    expect(hashes.length).toBeGreaterThan(0);
    for (const h of hashes) expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(hashes).not.toContain(raw1);
    expect(hashes).not.toContain(raw2);
    const logs = logged(spies);
    for (const secret of [raw1, raw2, access, PW]) expect(logs).not.toContain(secret);
  });

  it('5xx 로그에는 경로·시각이 있고 비밀번호·토큰은 없다 (NFR-12)', async () => {
    const u = await authed(app);
    const access = cookieValue(u.cookies, 'access_token');
    const spies = spyLogs();
    vi.spyOn(pool, 'query').mockRejectedValueOnce(new Error('db down'));
    const res = await request(app)
      .patch('/api/users/me')
      .set('Cookie', u.cookies)
      .send({ name: '이름', password: PW });
    expect(res.status).toBe(500);
    const errorCall = spies[LEVELS.indexOf('error')].mock.calls[0][0];
    expect(errorCall.path).toBe('/api/users/me');
    expect(errorCall.time).toEqual(expect.any(String));
    const logs = logged(spies);
    expect(logs).not.toContain(PW);
    expect(logs).not.toContain(access);
  });
});

describe('리포지토리 SQL 정적 검사 (LP-06, SP-05, NFR-07)', () => {
  const dir = fileURLToPath(new URL('../../src/repositories/', import.meta.url));
  const files = readdirSync(dir).filter((f) => f.endsWith('.js'));

  it.each(files)('%s: SELECT * 없음, 보간은 상수·자리표시자·도메인 조각만', (f) => {
    const src = readFileSync(dir + f, 'utf8');
    expect(src).not.toMatch(/SELECT\s+\*/i);
    // 허용: 컬럼 목록 상수, WHERE 조합 변수, $n 자리표시자, domain의 상태·겹침 조각
    const rest = src
      .replace(/\$\$\{params\.length( - 1)?\}/g, '')
      .replace(/\$\{(COLS|PUBLIC|where)\}/g, '')
      .replace(/\$\{(statusCondition|overlapCondition)\([^)]*\)\}/g, '');
    expect(rest).not.toContain('${');
  });
});

describe('기본 카테고리 불변 (ER-12)', () => {
  it('카테고리 삭제·수정 시도 후에도 모든 사용자에게 기본 카테고리가 정확히 1개', async () => {
    const a = await userWithData();
    const b = await userWithData();
    for (const { u, cat } of [a, b]) {
      const def = (
        await request(app).get('/api/categories').set('Cookie', u.cookies)
      ).body.items.find((c) => c.isDefault);
      await request(app).delete(`/api/categories/${def.id}`).set('Cookie', u.cookies);
      await request(app)
        .patch(`/api/categories/${def.id}`)
        .set('Cookie', u.cookies)
        .send({ name: 'x' });
      await request(app)
        .patch(`/api/categories/${cat.id}`)
        .set('Cookie', u.cookies)
        .send({ name: '기본' });
      await request(app).delete(`/api/categories/${cat.id}`).set('Cookie', u.cookies);
    }
    const rows = await query(
      `SELECT u.id, count(c.id) FILTER (WHERE c.is_default) AS n
       FROM users u LEFT JOIN categories c ON c.user_id = u.id GROUP BY u.id`,
    );
    expect(rows).toHaveLength(2);
    for (const r of rows) expect(r.n).toBe(1);
  });
});
