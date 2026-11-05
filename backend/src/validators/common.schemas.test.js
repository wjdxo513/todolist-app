import { describe, expect, it } from 'vitest';
import { dateString, idParams, todaySchema } from './common.schemas.js';

describe('idParams', () => {
  it('문자열 ID를 Number로 변환', () => {
    expect(idParams.parse({ id: '1' })).toEqual({ id: 1 });
    expect(idParams.parse({ id: '2147483647' })).toEqual({ id: 2147483647 });
  });
  it.each(['0', '-1', '01', '1.5', 'abc', '', '2147483648', '1e3'])('%j 는 실패', (id) => {
    expect(idParams.safeParse({ id }).success).toBe(false);
  });
});

describe('todaySchema / dateString', () => {
  it('유효한 날짜 통과', () => {
    expect(todaySchema.parse({ today: '2024-02-29' })).toEqual({ today: '2024-02-29' });
  });
  it.each(['2025-02-29', '2026-1-1', '', '2026-13-01'])('today=%j 는 실패', (today) => {
    expect(todaySchema.safeParse({ today }).success).toBe(false);
  });
  it('today 누락은 실패', () => {
    expect(todaySchema.safeParse({}).success).toBe(false);
  });
  it('dateString은 무효 날짜 거부', () => {
    expect(dateString.safeParse('2026-02-30').success).toBe(false);
    expect(dateString.safeParse('2026-02-28').success).toBe(true);
  });
});
