import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  addDays,
  addMonths,
  dayOfWeek,
  daysInMonth,
  diffDays,
  formatShort,
  monthRange,
  parseDate,
  todayLocal,
  toDateString,
  weekRange,
} from './date';

describe('todayLocal (TP-06, NP-21)', () => {
  afterEach(() => vi.useRealTimers());

  it('비UTC TZ에서 로컬 2026-11-04 23:30이면 2026-11-04를 반환한다', () => {
    expect(new Date(2026, 10, 4).getTimezoneOffset()).not.toBe(0);
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 4, 23, 30));
    expect(todayLocal()).toBe('2026-11-04');
  });

  it('인자로 받은 시각도 로컬 기준으로 변환한다', () => {
    expect(todayLocal(new Date(2026, 0, 1, 0, 0))).toBe('2026-01-01');
  });
});

describe('날짜 계산 경계 (AS-09, NP-20)', () => {
  it('연말·월말·윤년 덧셈', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
    expect(addDays('2026-11-04', 0)).toBe('2026-11-04');
  });

  it('월 이동은 말일을 넘지 않는다', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2028-01-31', 1)).toBe('2028-02-29');
    expect(addMonths('2026-12-15', 1)).toBe('2027-01-15');
    expect(addMonths('2026-01-15', -1)).toBe('2025-12-15');
  });

  it('주(일~토)·월 범위', () => {
    expect(weekRange('2026-11-04')).toEqual({ from: '2026-11-01', to: '2026-11-07' });
    expect(weekRange('2026-11-01')).toEqual({ from: '2026-11-01', to: '2026-11-07' });
    expect(weekRange('2026-12-31')).toEqual({ from: '2026-12-27', to: '2027-01-02' });
    expect(monthRange('2026-11-04')).toEqual({ from: '2026-11-01', to: '2026-11-30' });
    expect(monthRange('2028-02-10')).toEqual({ from: '2028-02-01', to: '2028-02-29' });
  });

  it('요일·일수·차이·변환', () => {
    expect(dayOfWeek('2026-11-01')).toBe(0);
    expect(dayOfWeek('2026-11-07')).toBe(6);
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2028, 2)).toBe(29);
    expect(diffDays('2026-12-31', '2027-01-01')).toBe(1);
    expect(diffDays('2026-11-04', '2026-11-01')).toBe(-3);
    expect(toDateString(7, 1, 2)).toBe('0007-01-02');
    expect(parseDate('2026-11-04')).toEqual({ y: 2026, m: 11, d: 4 });
  });

  it('MM-DD 표기는 올해만(WA-24)', () => {
    expect(formatShort('2026-11-04', '2026-01-01')).toBe('11-04');
    expect(formatShort('2027-01-02', '2026-11-04')).toBe('2027-01-02');
  });
});
