import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app.js';
import { pool } from '../../src/db/pool.js';
import { loginAttempts } from '../../src/lib/loginAttempts.js';
import { verifyDummy } from '../../src/lib/password.js';
import { signup } from '../helpers/auth.js';

vi.mock('../../src/lib/password.js', async (importOriginal) => {
  const orig = await importOriginal();
  return { ...orig, verifyDummy: vi.fn(orig.verifyDummy) };
});

afterAll(() => pool.end());
beforeEach(() => {
  loginAttempts.clear();
  verifyDummy.mockClear();
});

const app = createApp();

describe('로그인 더미 비교 (SP-04)', () => {
  it('없는 이메일 로그인은 verifyDummy를 호출한다', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@example.com', password: 'password123' });
    expect(res.status).toBe(401);
    expect(verifyDummy).toHaveBeenCalledTimes(1);
  });

  it('존재하는 이메일 로그인은 verifyDummy를 호출하지 않는다', async () => {
    const { body } = await signup(app);
    verifyDummy.mockClear();
    await request(app).post('/api/auth/login').send({ email: body.email, password: 'wrongpass1' });
    expect(verifyDummy).not.toHaveBeenCalled();
  });
});
