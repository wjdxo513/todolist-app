import { describe, expect, it } from 'vitest';
import { assertTestDbUrl } from './setup.js';

describe('assertTestDbUrl (TP-04)', () => {
  it.each(['postgres://u:p@localhost:5432/todolist', undefined, ''])('%j 는 throw', (url) => {
    expect(() => assertTestDbUrl(url)).toThrow();
  });
  it('_test 로 끝나면 통과', () => {
    expect(() => assertTestDbUrl('postgres://u:p@localhost:5432/todolist_test')).not.toThrow();
  });
});
