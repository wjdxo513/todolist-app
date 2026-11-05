import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCalendarStore } from './calendarStore';

const s = () => useCalendarStore.getState();

describe('calendarStore (WA-17, D-13)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 4, 9, 0));
  });
  afterEach(() => vi.useRealTimers());

  it('초기값은 월 뷰', () => {
    expect(s().view).toBe('month');
  });

  it('뷰 전환에도 기준일이 유지되고 이전·다음이 월 ±1, 주 ±7일, 일 ±1일로 이동한다', () => {
    s().openDay('2026-01-31');
    expect(s()).toMatchObject({ view: 'day', baseDate: '2026-01-31' });
    s().setView('month');
    expect(s().baseDate).toBe('2026-01-31');
    s().move(1);
    expect(s().baseDate).toBe('2026-02-28');
    s().move(-1);
    expect(s().baseDate).toBe('2026-01-28');
    s().setView('week');
    expect(s().baseDate).toBe('2026-01-28');
    s().move(1);
    expect(s().baseDate).toBe('2026-02-04');
    s().move(-1);
    expect(s().baseDate).toBe('2026-01-28');
    s().setView('day');
    s().move(-1);
    expect(s().baseDate).toBe('2026-01-27');
    s().move(1);
    expect(s().baseDate).toBe('2026-01-28');
  });

  it('오늘 이동은 로컬 오늘로 간다', () => {
    s().openDay('2025-05-05');
    s().goToday();
    expect(s().baseDate).toBe('2026-11-04');
  });
});
