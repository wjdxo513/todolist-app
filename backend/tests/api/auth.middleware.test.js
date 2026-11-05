import cookieParser from 'cookie-parser';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadEnv } from '../../src/config/env.js';
import { ACCESS_COOKIE, signAccessToken } from '../../src/lib/jwt.js';
import { requireAuth } from '../../src/middlewares/auth.js';
import { errorHandler } from '../../src/middlewares/errorHandler.js';

afterEach(() => vi.useRealTimers());

const app = express();
app.use(cookieParser());
app.get('/p', requireAuth, (req, res) => res.json({ userId: req.userId }));
app.use(errorHandler);

const get = (token) => {
  const r = request(app).get('/p');
  return token === undefined ? r : r.set('Cookie', `${ACCESS_COOKIE}=${token}`);
};
const expect401 = (res) => {
  expect(res.status).toBe(401);
  expect(res.body.error.code).toBe('UNAUTHENTICATED');
  expect(typeof res.body.error.message).toBe('string');
};
const secret = () => loadEnv().JWT_SECRET;

describe('requireAuth (BE-05)', () => {
  it('유효 토큰이면 req.userId 설정', async () => {
    const res = await get(signAccessToken(5));
    expect(res.status).toBe(200);
    expect(res.body.userId).toBe(5);
  });

  it('쿠키 없음 / 서명 오류 / 쓰레기 값은 401', async () => {
    expect401(await get());
    expect401(await get(jwt.sign({ sub: '1' }, 'y'.repeat(64), { algorithm: 'HS384' })));
    expect401(await get('garbage'));
  });

  it('15분 경과 후 만료되면 401', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const token = signAccessToken(1);
    vi.setSystemTime(Date.now() + 901_000);
    expect401(await get(token));
  });

  it('HS256·HS512·alg none 토큰은 401', async () => {
    const p = { sub: '1' };
    expect401(await get(jwt.sign(p, secret(), { algorithm: 'HS256', expiresIn: 60 })));
    expect401(await get(jwt.sign(p, secret(), { algorithm: 'HS512', expiresIn: 60 })));
    const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
    expect401(
      await get(`${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: '1', exp: 9999999999 })}.`),
    );
  });
});
