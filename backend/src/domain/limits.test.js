import { expect, it } from 'vitest';
import { LIMITS } from './limits.js';

it('AS-08 값과 일치하고 동결되어 있다', () => {
  expect(LIMITS).toEqual({
    TITLE_MAX: 100,
    MEMO_MAX: 1000,
    CATEGORY_NAME_MAX: 20,
    USER_NAME_MAX: 50,
    PASSWORD_MIN: 8,
    PASSWORD_MAX_BYTES: 72,
    EMAIL_MAX: 255,
  });
  expect(Object.isFrozen(LIMITS)).toBe(true);
});
