import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app.js';
import { pool } from '../../src/db/pool.js';
import { query } from '../../src/db/query.js';
import { hashRefreshToken } from '../../src/lib/jwt.js';
import { loginAttempts } from '../../src/lib/loginAttempts.js';
import { logger } from '../../src/lib/logger.js';
import { authed, login, signup } from '../helpers/auth.js';

afterAll(() => pool.end());
beforeEach(() => loginAttempts.clear());
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const app = createApp();
const cookieOf = (cookies, name) => cookies.find((c) => c.startsWith(`${name}=`));
const valueOf = (cookie) => cookie.split(';')[0].split('=')[1];
const expired = (c) => /Max-Age=0|Expires=Thu, 01 Jan 1970/i.test(c);
const refreshWith = (raw) => {
  const r = request(app).post('/api/auth/refresh');
  return raw === undefined ? r : r.set('Cookie', `refresh_token=${raw}`);
};
const rawRefresh = (cookies) => valueOf(cookieOf(cookies, 'refresh_token'));
const rows = () => query('SELECT * FROM refresh_tokens ORDER BY id');
const time = (d) => new Date(d).getTime();
const HOUR = 3600_000;

describe('POST /api/auth/refresh (BE-17)', () => {
  it('204, 쿠키 속성, 새 access는 HS384·sub=사용자 id, 새 쿠키로 me 200', async () => {
    const u = await authed(app);
    const res = await refreshWith(rawRefresh(u.cookies));
    expect(res.status).toBe(204);
    const set = res.headers['set-cookie'];
    const a = cookieOf(set, 'access_token');
    const r = cookieOf(set, 'refresh_token');
    expect(a).toMatch(/HttpOnly/i);
    expect(a).toMatch(/SameSite=Lax/i);
    expect(a).toMatch(/Path=\/(;|$)/);
    expect(a).toMatch(/Max-Age=900(;|$)/);
    expect(r).toMatch(/HttpOnly/i);
    expect(r).toMatch(/Path=\/api\/auth(;|$)/);
    expect(r).toMatch(/Max-Age=604800(;|$)/);

    const decoded = jwt.decode(valueOf(a), { complete: true });
    expect(decoded.header.alg).toBe('HS384');
    expect(decoded.payload.sub).toBe(String(u.id));

    const me = await request(app)
      .get('/api/users/me')
      .set('Cookie', [`access_token=${valueOf(a)}`]);
    expect(me.status).toBe(200);
    expect(me.body.id).toBe(u.id);
  });

  it('rotation: 이전 행 삭제, 행 수 불변, 새 해시 64자 hex, expires_at 유지', async () => {
    const u = await authed(app);
    const [old] = await rows();
    const res = await refreshWith(rawRefresh(u.cookies));
    const newRaw = rawRefresh(res.headers['set-cookie']);
    const after = await rows();
    expect(after).toHaveLength(1);
    expect(after.find((x) => x.tokenHash === old.tokenHash)).toBeUndefined();
    expect(after[0].tokenHash).not.toBe(old.tokenHash);
    expect(after[0].tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(after[0].tokenHash).toBe(hashRefreshToken(newRaw));
    expect(after[0].tokenHash).not.toBe(newRaw);
    expect(time(after[0].expiresAt)).toBe(time(old.expiresAt));
  });

  it('+6일 23시간이면 성공하고 expires_at 그대로', async () => {
    const u = await authed(app);
    const [old] = await rows();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.now() + (6 * 24 + 23) * HOUR);
    const res = await refreshWith(rawRefresh(u.cookies));
    expect(res.status).toBe(204);
    expect(time((await rows())[0].expiresAt)).toBe(time(old.expiresAt));
  });

  it('+7일 1초면 401', async () => {
    const u = await authed(app);
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.now() + 7 * 24 * HOUR + 1000);
    const res = await refreshWith(rawRefresh(u.cookies));
    expect(res.status).toBe(401);
    expect(res.headers['set-cookie'].filter(expired)).toHaveLength(2);
  });

  it('이미 사용된 토큰은 401 + 쿠키 만료, 같은 사용자의 다른 행 불변', async () => {
    const { body } = await signup(app);
    const first = await login(app, body.email);
    await login(app, body.email);
    const [, second] = await rows();
    await refreshWith(rawRefresh(first.cookies));
    const res = await refreshWith(rawRefresh(first.cookies));
    expect(res.status).toBe(401);
    const set = res.headers['set-cookie'];
    expect(expired(cookieOf(set, 'access_token'))).toBe(true);
    expect(expired(cookieOf(set, 'refresh_token'))).toBe(true);
    const after = await rows();
    const again = after.find((x) => x.id === second.id);
    expect(again).toBeDefined();
    expect(again.tokenHash).toBe(second.tokenHash);
    expect(time(again.expiresAt)).toBe(time(second.expiresAt));
    expect(after).toHaveLength(2);
  });

  it('쿠키 없음·임의 값·만료 행은 401 + 쿠키 만료', async () => {
    const u = await authed(app);
    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, now() - interval '1 day')`,
      [u.id, hashRefreshToken('expired-raw')],
    );
    for (const raw of [undefined, 'random-value', 'expired-raw']) {
      const res = await refreshWith(raw);
      expect(res.status).toBe(401);
      expect(res.headers['set-cookie'].filter(expired)).toHaveLength(2);
    }
  });

  it('INSERT 실패 시 500, 기존 행 유지', async () => {
    const u = await authed(app);
    const [old] = await rows();
    await pool.query(
      `CREATE FUNCTION fail_ins() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'forced'; END$$`,
    );
    await pool.query(
      'CREATE TRIGGER fail_ins BEFORE INSERT ON refresh_tokens FOR EACH ROW EXECUTE FUNCTION fail_ins()',
    );
    try {
      const res = await refreshWith(rawRefresh(u.cookies));
      expect(res.status).toBe(500);
    } finally {
      await pool.query('DROP TRIGGER IF EXISTS fail_ins ON refresh_tokens');
      await pool.query('DROP FUNCTION IF EXISTS fail_ins()');
    }
    const after = await rows();
    expect(after).toHaveLength(1);
    expect(after[0].tokenHash).toBe(old.tokenHash);
  });

  it('같은 토큰 동시 2회는 하나만 204, 나머지 401', async () => {
    const u = await authed(app);
    const raw = rawRefresh(u.cookies);
    const rs = await Promise.all([refreshWith(raw), refreshWith(raw)]);
    expect(rs.map((r) => r.status).sort()).toEqual([204, 401]);
    expect(await rows()).toHaveLength(1);
  });

  it('로그에 쿠키 원문이 남지 않는다', async () => {
    const calls = [];
    for (const m of ['trace', 'debug', 'info', 'warn', 'error', 'fatal']) {
      vi.spyOn(logger, m).mockImplementation((...a) => calls.push(a));
    }
    const u = await authed(app);
    const oldRaw = rawRefresh(u.cookies);
    const ok = await refreshWith(oldRaw);
    const newRaw = rawRefresh(ok.headers['set-cookie']);
    await refreshWith(oldRaw); // 재사용 실패 경로
    const dump = JSON.stringify(calls, (k, v) =>
      v instanceof Error ? { m: v.message, s: v.stack } : v,
    );
    expect(dump).not.toContain(oldRaw);
    expect(dump).not.toContain(newRaw);
  });
});
