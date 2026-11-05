import { afterEach, describe, expect, it, vi } from 'vitest';
import { hashPassword, verifyDummy, verifyPassword } from './password.js';

afterEach(() => vi.unstubAllEnvs());

describe('password', () => {
  it('해시는 평문과 다르고 일치·불일치를 구분', async () => {
    const h = await hashPassword('password123');
    expect(h).not.toContain('password123');
    expect(await verifyPassword('password123', h)).toBe(true);
    expect(await verifyPassword('password124', h)).toBe(false);
  });

  it('BCRYPT_COST가 해시에 반영', async () => {
    expect(await hashPassword('password123')).toMatch(/^\$2b\$04\$/);
    vi.stubEnv('BCRYPT_COST', '5');
    expect(await hashPassword('password123')).toMatch(/^\$2b\$05\$/);
  });

  it('verifyDummy는 항상 false', async () => {
    expect(await verifyDummy('password123')).toBe(false);
    expect(await verifyDummy('')).toBe(false);
  });
});
