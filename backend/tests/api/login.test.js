import request from 'supertest';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app.js';
import { pool } from '../../src/db/pool.js';
import { query } from '../../src/db/query.js';
import { hashRefreshToken } from '../../src/lib/jwt.js';
import { loginAttempts } from '../../src/lib/loginAttempts.js';
import { logger } from '../../src/lib/logger.js';
import { PW, authed, login, signup } from '../helpers/auth.js';

afterAll(() => pool.end());
beforeEach(() => loginAttempts.clear());
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const app = createApp();
const cookieOf = (cookies, name) => cookies.find((c) => c.startsWith(`${name}=`));
const valueOf = (cookie) => cookie.split(';')[0].split('=')[1];
const attr = (cookie, re) => re.test(cookie);

describe('POST /api/auth/login 성공 (BE-07)', () => {
  it('200, 쿠키 2종 속성, 본문에 해시·토큰 없음', async () => {
    const { body } = await signup(app);
    const { res, cookies } = await login(app, body.email);
    expect(res.status).toBe(200);
    expect(cookies).toHaveLength(2);

    const a = cookieOf(cookies, 'access_token');
    expect(a).toMatch(/HttpOnly/i);
    expect(a).toMatch(/SameSite=Lax/i);
    expect(a).toMatch(/Path=\/(;|$)/);
    expect(a).toMatch(/Max-Age=900(;|$)/);
    const r = cookieOf(cookies, 'refresh_token');
    expect(r).toMatch(/HttpOnly/i);
    expect(r).toMatch(/SameSite=Lax/i);
    expect(r).toMatch(/Path=\/api\/auth(;|$)/);
    expect(r).toMatch(/Max-Age=604800(;|$)/);
    expect(a).not.toMatch(/Secure/i);

    const text = JSON.stringify(res.body);
    expect(text).not.toMatch(/password|hash/i);
    expect(text).not.toContain(valueOf(a));
    expect(text).not.toContain(valueOf(r));
  });

  it('로그인마다 refresh_tokens 1행, 해시만 저장, expires_at = 로그인+7일', async () => {
    const { body } = await signup(app);
    const before = Date.now();
    const { cookies } = await login(app, body.email);
    await login(app, body.email);
    const rows = await query('SELECT * FROM refresh_tokens ORDER BY id');
    expect(rows).toHaveLength(2);
    const raw = valueOf(cookieOf(cookies, 'refresh_token'));
    expect(rows[0].tokenHash).toBe(hashRefreshToken(raw));
    expect(rows[0].tokenHash).toHaveLength(64);
    expect(rows[0].tokenHash).not.toBe(raw);
    const diff = new Date(rows[0].expiresAt).getTime() - before;
    expect(Math.abs(diff - 7 * 24 * 3600 * 1000)).toBeLessThan(10_000);
  });

  it('이메일은 대소문자·공백 무관하게 로그인', async () => {
    const { body } = await signup(app, { email: 'case@example.com' });
    const { res } = await login(app, ` ${body.email.toUpperCase()} `);
    expect(res.status).toBe(200);
  });
});

describe('만료 행 정리 (ER-16)', () => {
  it('그 사용자의 만료 행만 삭제, 미만료·타 사용자 만료 행은 유지', async () => {
    const { body: u1 } = await signup(app);
    const { body: u2 } = await signup(app);
    const [{ id: id1 }, { id: id2 }] = await query('SELECT id FROM users ORDER BY id');
    const ins = (uid, h, interval) =>
      query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, now() + $3::interval)`,
        [uid, h.repeat(64).slice(0, 64), interval],
      );
    await ins(id1, 'a', '-1 day');
    await ins(id1, 'b', '1 day');
    await ins(id2, 'c', '-1 day');

    expect((await login(app, u1.email)).res.status).toBe(200);
    const hashes = (await query('SELECT token_hash FROM refresh_tokens')).map((r) => r.tokenHash);
    expect(hashes).not.toContain('a'.repeat(64));
    expect(hashes).toContain('b'.repeat(64));
    expect(hashes).toContain('c'.repeat(64));
    expect(hashes).toHaveLength(3); // b, c, 새 행
    void u2;
  });

  it('정리 DELETE가 실패해도 로그인은 성공하고 새 행이 저장된다 (D-16)', async () => {
    const { body: u } = await signup(app);
    await pool.query(
      `CREATE FUNCTION fail_trg() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'forced'; END$$`,
    );
    await pool.query(
      'CREATE TRIGGER t BEFORE DELETE ON refresh_tokens FOR EACH ROW EXECUTE FUNCTION fail_trg()',
    );
    try {
      const [{ id: userId }] = await query('SELECT id FROM users WHERE email = $1', [u.email]);
      await query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, now() - interval '1 day')`,
        [userId, 'e'.repeat(64)],
      );
      const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});
      expect((await login(app, u.email)).res.status).toBe(200);
      expect(warn).toHaveBeenCalled();
      expect(await query('SELECT 1 FROM refresh_tokens')).toHaveLength(2); // 만료 행 + 새 행
    } finally {
      await pool.query('DROP TRIGGER IF EXISTS t ON refresh_tokens');
      await pool.query('DROP FUNCTION IF EXISTS fail_trg()');
    }
  });
});

describe('로그인 실패 (NP-16)', () => {
  it('비밀번호 오류와 없는 이메일은 상태·code·본문이 동일', async () => {
    const { body } = await signup(app);
    const wrong = await login(app, body.email, 'wrongpassword');
    const none = await login(app, 'nobody@example.com', 'wrongpassword');
    expect(wrong.res.status).toBe(401);
    expect(wrong.res.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(none.res.status).toBe(401);
    expect(none.res.body).toEqual(wrong.res.body);
    expect(wrong.cookies).toEqual([]);
  });
});

describe('로그인 시도 제한 (D-07)', () => {
  it('5번째는 401, 6번째는 정답이어도 429 TOO_MANY_ATTEMPTS', async () => {
    const { body } = await signup(app);
    for (let i = 0; i < 5; i++) {
      expect((await login(app, body.email, 'wrongpassword')).res.status).toBe(401);
    }
    const res = (await login(app, body.email, PW)).res;
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('TOO_MANY_ATTEMPTS');
  });

  it('동시 요청 30개도 5개만 비밀번호를 검사하고 나머지는 429', async () => {
    const { body } = await signup(app);
    const res = await Promise.all(
      Array.from({ length: 30 }, () => login(app, body.email, 'wrongpassword')),
    );
    const statuses = res.map((r) => r.res.status);
    expect(statuses.filter((s) => s === 401)).toHaveLength(5);
    expect(statuses.filter((s) => s === 429)).toHaveLength(25);
  });

  it('5번째 시도가 정답이면 200이고 차단되지 않는다', async () => {
    const { body } = await signup(app);
    for (let i = 0; i < 4; i++) await login(app, body.email, 'wrongpassword');
    expect((await login(app, body.email, PW)).res.status).toBe(200);
    expect((await login(app, body.email, 'wrongpassword')).res.status).toBe(401);
  });

  it('5분 경과 후 성공', async () => {
    const { body } = await signup(app);
    vi.useFakeTimers({ toFake: ['Date'] });
    for (let i = 0; i < 5; i++) await login(app, body.email, 'wrongpassword');
    vi.setSystemTime(Date.now() + 299_000);
    expect((await login(app, body.email, PW)).res.status).toBe(429);
    vi.setSystemTime(Date.now() + 2_000);
    expect((await login(app, body.email, PW)).res.status).toBe(200);
  });

  it('5회 미만 실패 후 성공하면 횟수 초기화', async () => {
    const { body } = await signup(app);
    for (let i = 0; i < 4; i++) await login(app, body.email, 'wrongpassword');
    expect((await login(app, body.email, PW)).res.status).toBe(200);
    for (let i = 0; i < 4; i++) await login(app, body.email, 'wrongpassword');
    expect((await login(app, body.email, PW)).res.status).toBe(200);
  });

  it('없는 이메일 5회 실패도 429, 대소문자 다른 이메일은 같은 집계', async () => {
    const emails = ['ghost@example.com', 'GHOST@example.com', 'Ghost@Example.com'];
    for (let i = 0; i < 5; i++) {
      expect((await login(app, emails[i % 3], 'wrongpassword')).res.status).toBe(401);
    }
    const res = (await login(app, 'ghost@EXAMPLE.com', 'wrongpassword')).res;
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('TOO_MANY_ATTEMPTS');
  });
});

describe('POST /api/auth/logout', () => {
  const expired = (c) => attr(c, /Max-Age=0|Expires=Thu, 01 Jan 1970/i);

  it('access 쿠키 없이 refresh 쿠키만으로 해당 행만 삭제, 두 쿠키 만료, 204', async () => {
    const { body } = await signup(app);
    const a = await login(app, body.email);
    await login(app, body.email); // 다른 기기
    const refresh = cookieOf(a.cookies, 'refresh_token').split(';')[0];
    const res = await request(app).post('/api/auth/logout').set('Cookie', refresh);
    expect(res.status).toBe(204);

    const set = res.headers['set-cookie'];
    const ac = cookieOf(set, 'access_token');
    const rc = cookieOf(set, 'refresh_token');
    expect(expired(ac) && expired(rc)).toBe(true);
    expect(ac).toMatch(/Path=\/(;|$)/);
    expect(rc).toMatch(/Path=\/api\/auth(;|$)/);
    for (const c of [ac, rc]) {
      expect(c).toMatch(/HttpOnly/i);
      expect(c).toMatch(/SameSite=Lax/i);
    }

    const rows = await query('SELECT token_hash FROM refresh_tokens');
    expect(rows).toHaveLength(1);
    expect(rows[0].tokenHash).not.toBe(hashRefreshToken(refresh.split('=')[1]));
  });

  it('쿠키 없음 / 일치 행 없음이어도 204 + 쿠키 만료', async () => {
    for (const req of [
      request(app).post('/api/auth/logout'),
      request(app).post('/api/auth/logout').set('Cookie', 'refresh_token=nonexistent'),
    ]) {
      const res = await req;
      expect(res.status).toBe(204);
      expect(res.headers['set-cookie'].filter(expired)).toHaveLength(2);
    }
  });
});

describe('보호 API / me', () => {
  it('쿠키 없이 보호 API 호출은 401', async () => {
    for (const [m, p] of [
      ['get', '/api/users/me'],
      ['patch', '/api/users/me'],
      ['put', '/api/users/me/password'],
      ['get', '/api/categories'],
      ['post', '/api/categories'],
    ]) {
      const res = await request(app)[m](p).send({});
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    }
  });

  it('me는 id·email·name만 반환', async () => {
    const u = await authed(app, { name: '철수' });
    const res = await request(app).get('/api/users/me').set('Cookie', u.cookies);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: u.id, email: u.email, name: '철수' });
  });
});

describe('로그 (NFR-05, NFR-12)', () => {
  it('어떤 로그에도 비밀번호가 남지 않는다', async () => {
    const calls = [];
    for (const m of ['trace', 'debug', 'info', 'warn', 'error', 'fatal']) {
      vi.spyOn(logger, m).mockImplementation((...a) => calls.push(a));
    }
    const pw = 'S3cretPw!zzz';
    const { body } = await signup(app, { password: pw });
    await login(app, body.email, pw);
    await login(app, body.email, 'WrongPw!yyy1');
    await login(app, 'ghost@example.com', 'WrongPw!yyy1');
    const dump = JSON.stringify(calls, (k, v) =>
      v instanceof Error ? { m: v.message, s: v.stack } : v,
    );
    expect(dump).not.toContain(pw);
    expect(dump).not.toContain('WrongPw!yyy1');
  });
});
