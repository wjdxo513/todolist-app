import { describe, expect, it } from 'vitest';
import { createLoginAttempts } from './loginAttempts.js';

function setup(opts = {}) {
  const t = { now: 1_000_000 };
  const la = createLoginAttempts({ now: () => t.now, ...opts });
  return { t, la };
}
const fail = (la, e, n) => {
  for (let i = 0; i < n; i++) la.recordFailure(e);
};

describe('loginAttempts', () => {
  it('4회 실패까지는 차단 아님, 5회째부터 차단', () => {
    const { la } = setup();
    fail(la, 'a@x.com', 4);
    expect(la.isBlocked('a@x.com')).toBe(false);
    la.recordFailure('a@x.com');
    expect(la.isBlocked('a@x.com')).toBe(true);
  });

  it('차단 4분59초 유지, 5분에 해제, 차단 중 시도는 연장하지 않음', () => {
    const { t, la } = setup();
    fail(la, 'a@x.com', 5);
    t.now += 299_000;
    expect(la.isBlocked('a@x.com')).toBe(true);
    la.recordFailure('a@x.com'); // 차단 중 시도
    t.now += 1_000;
    expect(la.isBlocked('a@x.com')).toBe(false);
  });

  it('이메일은 trim+소문자 단위로 집계', () => {
    const { la } = setup();
    fail(la, 'A@X.com', 3);
    fail(la, ' a@x.com ', 2);
    expect(la.isBlocked('a@x.COM')).toBe(true);
    expect(la.isBlocked('b@x.com')).toBe(false);
  });

  it('reset은 횟수를 초기화', () => {
    const { la } = setup();
    fail(la, 'a@x.com', 4);
    la.reset('a@x.com');
    fail(la, 'a@x.com', 4);
    expect(la.isBlocked('a@x.com')).toBe(false);
  });

  it('마지막 실패 후 5분 지난 미차단 기록은 접근 시 삭제(횟수 0)', () => {
    const { t, la } = setup();
    fail(la, 'a@x.com', 4);
    t.now += 300_000;
    expect(la.isBlocked('a@x.com')).toBe(false);
    expect(la.size()).toBe(0);
    fail(la, 'a@x.com', 4); // 1회부터 다시 집계
    expect(la.isBlocked('a@x.com')).toBe(false);
  });

  it('maxEntries 초과 시 추가할 때 만료분 일괄 삭제', () => {
    const { t, la } = setup({ maxEntries: 3 });
    fail(la, 'a@x.com', 1);
    fail(la, 'b@x.com', 1);
    fail(la, 'c@x.com', 1);
    expect(la.size()).toBe(3);
    t.now += 300_000;
    la.recordFailure('d@x.com');
    expect(la.size()).toBe(1);
  });

  it('maxEntries에 도달해도 만료되지 않은 기록은 지우지 않는다', () => {
    const { la } = setup({ maxEntries: 2 });
    fail(la, 'a@x.com', 1);
    fail(la, 'b@x.com', 1);
    la.recordFailure('c@x.com');
    expect(la.size()).toBe(3);
  });

  it('clear는 전부 삭제', () => {
    const { la } = setup();
    fail(la, 'a@x.com', 5);
    la.clear();
    expect(la.size()).toBe(0);
    expect(la.isBlocked('a@x.com')).toBe(false);
  });
});
