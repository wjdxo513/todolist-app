import { describe, expect, it } from 'vitest';
import { db } from '../test/handlers';
import { logIn, logOut, signUp } from './auth';

describe('api/auth (PRE-02)', () => {
  it('가입·로그인·로그아웃 경로와 메서드', async () => {
    await expect(
      signUp({ email: 'new@example.com', password: 'password123', name: '새' }),
    ).resolves.toMatchObject({
      email: 'new@example.com',
    });
    await expect(logIn({ email: 'hong@example.com', password: 'password123' })).resolves.toEqual(
      db.user,
    );
    await expect(logOut()).resolves.toBeUndefined();
    expect(db.requests.map((r) => [r.method, r.path, r.body])).toEqual([
      ['POST', '/auth/signup', { email: 'new@example.com', password: 'password123', name: '새' }],
      ['POST', '/auth/login', { email: 'hong@example.com', password: 'password123' }],
      ['POST', '/auth/logout', undefined],
    ]);
  });
});
