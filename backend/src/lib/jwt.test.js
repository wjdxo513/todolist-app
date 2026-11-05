import jwt from 'jsonwebtoken';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadEnv } from '../config/env.js';
import {
  ACCESS_TOKEN_TTL_SEC,
  REFRESH_TOKEN_TTL_SEC,
  accessCookieOptions,
  clearAccessCookieOptions,
  clearRefreshCookieOptions,
  createRefreshToken,
  hashRefreshToken,
  refreshCookieOptions,
  signAccessToken,
  verifyAccessToken,
} from './jwt.js';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

const secret = () => loadEnv().JWT_SECRET;
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');

describe('access token', () => {
  it('HS384 헤더, 페이로드는 sub·iat·exp만, exp-iat=900', () => {
    const t = signAccessToken(7);
    const { header, payload } = jwt.decode(t, { complete: true });
    expect(header.alg).toBe('HS384');
    expect(Object.keys(payload).sort()).toEqual(['exp', 'iat', 'sub']);
    expect(payload.sub).toBe('7');
    expect(payload.exp - payload.iat).toBe(900);
    expect(ACCESS_TOKEN_TTL_SEC).toBe(900);
    expect(REFRESH_TOKEN_TTL_SEC).toBe(604800);
  });

  it('검증은 Number userId를 반환', () => {
    expect(verifyAccessToken(signAccessToken(42))).toBe(42);
  });

  it('HS256·HS512·alg none·서명 오류·쓰레기 값은 거부', () => {
    const p = { sub: '1' };
    expect(() =>
      verifyAccessToken(jwt.sign(p, secret(), { algorithm: 'HS256', expiresIn: 60 })),
    ).toThrow();
    expect(() =>
      verifyAccessToken(jwt.sign(p, secret(), { algorithm: 'HS512', expiresIn: 60 })),
    ).toThrow();
    const none = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: '1', exp: 9999999999 })}.`;
    expect(() => verifyAccessToken(none)).toThrow();
    expect(() =>
      verifyAccessToken(jwt.sign(p, 'x'.repeat(64), { algorithm: 'HS384', expiresIn: 60 })),
    ).toThrow();
    expect(() => verifyAccessToken('garbage')).toThrow();
  });

  it('15분 경과 후 만료', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const t = signAccessToken(1);
    vi.setSystemTime(Date.now() + 899_000);
    expect(verifyAccessToken(t)).toBe(1);
    vi.setSystemTime(Date.now() + 2_000);
    expect(() => verifyAccessToken(t)).toThrow();
  });
});

describe('refresh token', () => {
  it('매번 다른 43자 base64url, 해시는 sha256 hex 64자이며 결정적', () => {
    const a = createRefreshToken();
    const b = createRefreshToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(a).not.toBe(b);
    expect(hashRefreshToken(a)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashRefreshToken(a)).toBe(hashRefreshToken(a));
    expect(hashRefreshToken(a)).not.toBe(hashRefreshToken(b));
  });
});

describe('cookie options', () => {
  it('access: httpOnly, lax, Path=/, 15분', () => {
    expect(accessCookieOptions()).toMatchObject({
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 900_000,
      secure: false,
    });
  });

  it('refresh: httpOnly, lax, Path=/api/auth, 7일', () => {
    expect(refreshCookieOptions()).toMatchObject({
      httpOnly: true,
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: 604_800_000,
      secure: false,
    });
  });

  it('production에서만 secure', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(accessCookieOptions().secure).toBe(true);
    expect(refreshCookieOptions().secure).toBe(true);
    expect(clearAccessCookieOptions().secure).toBe(true);
    expect(clearRefreshCookieOptions().secure).toBe(true);
  });

  it('만료용 옵션은 같은 Path·SameSite·HttpOnly, maxAge 없음', () => {
    for (const [clear, issue] of [
      [clearAccessCookieOptions(), accessCookieOptions()],
      [clearRefreshCookieOptions(), refreshCookieOptions()],
    ]) {
      expect(clear).toMatchObject({ path: issue.path, sameSite: 'lax', httpOnly: true });
      expect(clear.maxAge).toBeUndefined();
    }
  });
});
