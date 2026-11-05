import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { pool } from '../../src/db/pool.js';
import { query } from '../../src/db/query.js';
import { loginAttempts } from '../../src/lib/loginAttempts.js';
import { PW, authed, login } from '../helpers/auth.js';

afterAll(() => pool.end());
beforeEach(() => loginAttempts.clear());

const app = createApp();
const patchMe = (u, body) =>
  request(app).patch('/api/users/me').set('Cookie', u.cookies).send(body);
const putPw = (u, body) =>
  request(app).put('/api/users/me/password').set('Cookie', u.cookies).send(body);
const getMe = (u) => request(app).get('/api/users/me').set('Cookie', u.cookies);
const hashOf = async (id) =>
  (await query('SELECT password_hash FROM users WHERE id=$1', [id]))[0].passwordHash;

describe('PATCH /api/users/me (BE-08)', () => {
  it('이름 수정 200, 재조회 반영', async () => {
    const u = await authed(app);
    const res = await patchMe(u, { name: '새이름' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('새이름');
    expect((await getMe(u)).body.name).toBe('새이름');
  });

  it('빈 값·51자는 400, 50자는 허용', async () => {
    const u = await authed(app);
    for (const name of ['', 'a'.repeat(51)]) {
      const res = await patchMe(u, { name });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.fields).toHaveProperty('name');
    }
    expect((await patchMe(u, { name: 'a'.repeat(50) })).status).toBe(200);
  });

  it('email을 보내도 이메일은 바뀌지 않는다', async () => {
    const u = await authed(app);
    await patchMe(u, { name: '이름', email: 'hacker@example.com' });
    expect((await getMe(u)).body.email).toBe(u.email);
  });
});

describe('PUT /api/users/me/password (BE-08)', () => {
  it('변경 후 이전 비밀번호 401, 새 비밀번호 200', async () => {
    const u = await authed(app);
    const res = await putPw(u, { currentPassword: PW, newPassword: 'newpassword1' });
    expect(res.status).toBe(204);
    expect((await login(app, u.email, PW)).res.status).toBe(401);
    expect((await login(app, u.email, 'newpassword1')).res.status).toBe(200);
  });

  it('현재 비밀번호 불일치는 400 VALIDATION_ERROR(fields.currentPassword), 해시 불변', async () => {
    const u = await authed(app);
    const before = await hashOf(u.id);
    const res = await putPw(u, { currentPassword: 'wrongpass12', newPassword: 'newpassword1' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.code).not.toBe('UNAUTHENTICATED');
    expect(res.body.error.fields).toHaveProperty('currentPassword');
    expect(await hashOf(u.id)).toBe(before);
  });

  it('새 비밀번호 7자 400, 8자 허용', async () => {
    const u = await authed(app);
    const bad = await putPw(u, { currentPassword: PW, newPassword: '1234567' });
    expect(bad.status).toBe(400);
    expect(bad.body.error.fields).toHaveProperty('newPassword');
    expect((await putPw(u, { currentPassword: PW, newPassword: '12345678' })).status).toBe(204);
  });

  it('변경 후 기존 쿠키로 보호 API 200, 쿠키 재발급 없음', async () => {
    const u = await authed(app);
    const res = await putPw(u, { currentPassword: PW, newPassword: 'newpassword1' });
    expect(res.headers['set-cookie']).toBeUndefined();
    expect((await getMe(u)).status).toBe(200);
  });

  it('미인증은 401', async () => {
    const res = await request(app)
      .put('/api/users/me/password')
      .send({ currentPassword: PW, newPassword: 'newpassword1' });
    expect(res.status).toBe(401);
    expect((await request(app).patch('/api/users/me').send({ name: 'x' })).status).toBe(401);
  });
});
