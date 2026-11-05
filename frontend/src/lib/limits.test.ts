import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { LIMITS } from './limits';

// 백엔드 JS 모듈은 타입이 없어 원문에서 `KEY: 숫자`를 읽어 대조한다(AS-08)
const backendSrc = readFileSync(
  path.resolve(import.meta.dirname, '../../../backend/src/domain/limits.js'),
  'utf8',
);
const BACKEND = Object.fromEntries(
  [...backendSrc.matchAll(/(\w+):\s*(\d+)/g)].map(([, k, v]) => [k, Number(v)]),
);

describe('LIMITS (AS-08)', () => {
  it('문서 값과 일치한다', () => {
    expect(LIMITS).toMatchObject({
      TITLE_MAX: 100,
      MEMO_MAX: 1000,
      CATEGORY_NAME_MAX: 20,
      USER_NAME_MAX: 50,
      PASSWORD_MIN: 8,
    });
  });

  it('백엔드 domain/limits.js와 같은 키는 같은 값이다', () => {
    for (const [k, v] of Object.entries(LIMITS)) expect(BACKEND[k], k).toBe(v);
  });
});
