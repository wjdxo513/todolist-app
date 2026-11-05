import { describe, expect, it } from 'vitest';
import { db } from '../test/handlers';
import { changePassword, getMe, updateMe } from './users';

describe('api/users (PRE-02)', () => {
  it('내 정보 조회·이름 변경·비밀번호 변경 경로와 메서드', async () => {
    await expect(getMe()).resolves.toMatchObject({ name: '홍길동' });
    await expect(updateMe({ name: '김철수' })).resolves.toMatchObject({ name: '김철수' });
    const pw = { currentPassword: 'password123', newPassword: 'newpass123' };
    await expect(changePassword(pw)).resolves.toBeUndefined();
    expect(db.requests.map((r) => [r.method, r.path, r.body])).toEqual([
      ['GET', '/users/me', undefined],
      ['PATCH', '/users/me', { name: '김철수' }],
      ['PUT', '/users/me/password', pw],
    ]);
  });
});
