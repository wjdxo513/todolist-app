import { describe, expect, it } from 'vitest';
import { dayOfWeek, monthRange, weekRange } from '../../lib/date';
import { clip, gridWeeks, layoutWeek, viewRange, viewTitle } from './calendar';

// SN-12 데이터(오늘 2026-11-04)
const A = { id: 1, startDate: '2026-11-02', endDate: '2026-11-04' };
const B = { id: 2, startDate: '2026-11-06', endDate: '2026-11-10' };
const C = { id: 3, startDate: '2026-10-28', endDate: '2026-11-03' };
const SN12 = [A, B, C];

describe('viewRange · viewTitle', () => {
  it('월·주·일 범위(일요일 시작, AS-09)', () => {
    expect(viewRange('month', '2026-11-04')).toEqual({ from: '2026-11-01', to: '2026-11-30' });
    expect(viewRange('week', '2026-11-04')).toEqual({ from: '2026-11-01', to: '2026-11-07' });
    expect(viewRange('day', '2026-11-04')).toEqual({ from: '2026-11-04', to: '2026-11-04' });
  });

  it('범위 제목 형식(4번 문서 4.7)', () => {
    expect(viewTitle('month', '2026-11-04')).toBe('2026년 11월');
    expect(viewTitle('week', '2026-11-04')).toBe('2026.11.01 ~ 11.07');
    expect(viewTitle('day', '2026-11-04')).toBe('2026.11.04 (수)');
    expect(viewTitle('week', '2026-12-31')).toBe('2026.12.27 ~ 2027.01.02');
  });

  it('월말·연말·윤년 경계(NP-20)', () => {
    expect(viewRange('week', '2026-11-30')).toEqual({ from: '2026-11-29', to: '2026-12-05' });
    expect(viewTitle('week', '2026-11-30')).toBe('2026.11.29 ~ 12.05');
    expect(viewRange('week', '2027-01-01')).toEqual({ from: '2026-12-27', to: '2027-01-02' });
    expect(viewRange('month', '2028-02-10')).toEqual({ from: '2028-02-01', to: '2028-02-29' });
    expect(viewRange('month', '2026-02-10')).toEqual({ from: '2026-02-01', to: '2026-02-28' });
    expect(viewRange('month', '2026-12-31')).toEqual({ from: '2026-12-01', to: '2026-12-31' });
  });
});

describe('gridWeeks', () => {
  it('2026-11 월 그리드는 일요일 시작 5개 주 행', () => {
    const weeks = gridWeeks(monthRange('2026-11-04'));
    expect(weeks).toEqual(['2026-11-01', '2026-11-08', '2026-11-15', '2026-11-22', '2026-11-29']);
    expect(weeks.every((w) => dayOfWeek(w) === 0)).toBe(true);
  });

  it('1일이 일요일이 아닌 달은 앞 달 일요일부터, 2026-02는 정확히 4주', () => {
    expect(gridWeeks(monthRange('2026-12-01'))[0]).toBe('2026-11-29');
    expect(gridWeeks(monthRange('2026-02-01'))).toHaveLength(4);
    expect(gridWeeks(weekRange('2026-11-30'))).toEqual(['2026-11-29']);
  });
});

describe('clip: 3번 문서 4장 B표', () => {
  const month = viewRange('month', '2026-11-04');
  const week = viewRange('week', '2026-11-04');
  const day = viewRange('day', '2026-11-04');

  it('CV-01 월 뷰 10-28~11-03 → 11-01~11-03, 시작 이어짐', () => {
    expect(clip(C, month.from, month.to)).toEqual({
      start: '2026-11-01',
      end: '2026-11-03',
      continuesLeft: true,
      continuesRight: false,
    });
  });

  it('CV-02 주 뷰 11-06~11-12 → 11-06~11-07, 끝 이어짐', () => {
    expect(clip({ startDate: '2026-11-06', endDate: '2026-11-12' }, week.from, week.to)).toEqual({
      start: '2026-11-06',
      end: '2026-11-07',
      continuesLeft: false,
      continuesRight: true,
    });
  });

  it('CV-03 주 뷰 10-25~10-31 → 표시 안 함', () => {
    expect(clip({ startDate: '2026-10-25', endDate: '2026-10-31' }, week.from, week.to)).toBeNull();
  });

  it('CV-04 일 뷰 11-04~11-04 → 당일 표시', () => {
    expect(clip({ startDate: '2026-11-04', endDate: '2026-11-04' }, day.from, day.to)).toEqual({
      start: '2026-11-04',
      end: '2026-11-04',
      continuesLeft: false,
      continuesRight: false,
    });
  });

  it('CV-05 일 뷰 11-05~11-06 → 표시 안 함', () => {
    expect(clip({ startDate: '2026-11-05', endDate: '2026-11-06' }, day.from, day.to)).toBeNull();
  });
});

describe('layoutWeek', () => {
  const month = monthRange('2026-11-04');
  const bar = (layout: ReturnType<typeof layoutWeek<(typeof SN12)[number]>>, id: number) =>
    layout.bars.find((b) => b.item.id === id);

  it('SN-12 월 뷰: B는 두 주 행으로 분할, C는 11-01~11-03 한 구간, A는 11-02~11-04', () => {
    const w1 = layoutWeek(SN12, '2026-11-01', month, 3);
    const w2 = layoutWeek(SN12, '2026-11-08', month, 3);
    expect(bar(w1, 3)).toMatchObject({
      start: '2026-11-01',
      end: '2026-11-03',
      col: 0,
      span: 3,
      continuesLeft: true,
    });
    expect(bar(w1, 1)).toMatchObject({ start: '2026-11-02', end: '2026-11-04', col: 1, span: 3 });
    expect(bar(w1, 2)).toMatchObject({
      start: '2026-11-06',
      end: '2026-11-07',
      col: 5,
      span: 2,
      continuesRight: true,
    });
    expect(bar(w2, 2)).toMatchObject({
      start: '2026-11-08',
      end: '2026-11-10',
      col: 0,
      span: 3,
      continuesLeft: true,
      continuesRight: false,
    });
    expect(w2.bars.map((b) => b.item.id)).toEqual([2]);
    for (const w of ['2026-11-15', '2026-11-22', '2026-11-29']) {
      expect(layoutWeek(SN12, w, month, 3).bars).toEqual([]);
    }
  });

  it('SN-12 주 뷰 11-01~11-07: B는 11-06~11-07에만, 끝 이어짐', () => {
    const w = layoutWeek(SN12, '2026-11-01', weekRange('2026-11-04'), 3);
    expect(bar(w, 2)).toMatchObject({
      start: '2026-11-06',
      end: '2026-11-07',
      continuesRight: true,
    });
    expect(w.hidden).toEqual({});
  });

  it('겹치는 막대는 다른 줄, 겹치지 않으면 같은 줄을 다시 쓴다', () => {
    const { bars } = layoutWeek(SN12, '2026-11-01', month, 3);
    expect(bar({ bars, hidden: {} }, 3)?.lane).toBe(0); // C 11-01~03
    expect(bar({ bars, hidden: {} }, 1)?.lane).toBe(1); // A 11-02~04는 C와 겹침
    expect(bar({ bars, hidden: {} }, 2)?.lane).toBe(0); // B 11-06~은 C 뒤 같은 줄
  });

  it('한 날짜 막대 수가 한도를 넘으면 초과 건수 N을 센다(WA-18)', () => {
    const items = [
      { id: 1, startDate: '2026-11-04', endDate: '2026-11-04' },
      { id: 2, startDate: '2026-11-04', endDate: '2026-11-04' },
      { id: 3, startDate: '2026-11-04', endDate: '2026-11-04' },
      { id: 4, startDate: '2026-11-04', endDate: '2026-11-05' },
      { id: 5, startDate: '2026-11-04', endDate: '2026-11-04' },
    ];
    const r = layoutWeek(items, '2026-11-01', month, 3);
    expect(r.bars).toHaveLength(3);
    expect(r.bars.every((b) => b.lane < 3)).toBe(true);
    // 긴 막대(4)가 먼저 배치되므로 숨겨지는 것은 1일짜리 2건
    expect(r.hidden).toEqual({ '2026-11-04': 2 });
    expect(layoutWeek(items, '2026-11-01', month, 1).hidden).toEqual({ '2026-11-04': 4 });
    expect(layoutWeek(items, '2026-11-01', month, 5).hidden).toEqual({});
  });

  it('여러 날짜에 걸친 숨김 막대는 각 날짜에 센다', () => {
    const items = [
      { id: 1, startDate: '2026-11-02', endDate: '2026-11-04' },
      { id: 2, startDate: '2026-11-03', endDate: '2026-11-05' },
    ];
    expect(layoutWeek(items, '2026-11-01', month, 1).hidden).toEqual({
      '2026-11-03': 1,
      '2026-11-04': 1,
      '2026-11-05': 1,
    });
  });

  it('월 범위 밖 날짜(다음 달 칸)는 자르고 이어짐을 표시한다(월말 경계)', () => {
    const items = [
      { id: 1, startDate: '2026-11-28', endDate: '2026-12-03' },
      { id: 2, startDate: '2026-12-01', endDate: '2026-12-02' },
    ];
    const r = layoutWeek(items, '2026-11-29', month, 3);
    expect(r.bars).toHaveLength(1);
    expect(r.bars[0]).toMatchObject({
      start: '2026-11-29',
      end: '2026-11-30',
      col: 0,
      span: 2,
      continuesLeft: true,
      continuesRight: true,
    });
    // 같은 할일을 주 뷰(11-29~12-05)로 보면 12월까지 이어진다
    const w = layoutWeek(items, '2026-11-29', weekRange('2026-11-30'), 3);
    expect(w.bars.map((b) => [b.start, b.end])).toEqual([
      ['2026-11-29', '2026-12-03'],
      ['2026-12-01', '2026-12-02'],
    ]);
  });

  it('연말·윤년 경계 주에서도 열·길이가 맞다', () => {
    const y = layoutWeek(
      [{ id: 1, startDate: '2026-12-30', endDate: '2027-01-02' }],
      '2026-12-27',
      weekRange('2026-12-31'),
      3,
    );
    expect(y.bars[0]).toMatchObject({ col: 3, span: 4, continuesRight: false });
    const leap = layoutWeek(
      [{ id: 1, startDate: '2028-02-28', endDate: '2028-03-01' }],
      '2028-02-27',
      weekRange('2028-02-29'),
      3,
    );
    expect(leap.bars[0]).toMatchObject({ col: 1, span: 3 });
  });
});

describe('순수성·타임존(CP-08, TP-06)', () => {
  it('입력 객체를 변경하지 않는다', () => {
    const items = SN12.map((t) => Object.freeze({ ...t }));
    const snapshot = structuredClone(items);
    const range = Object.freeze({ from: '2026-11-01', to: '2026-11-30' });
    layoutWeek(Object.freeze(items), '2026-11-01', range, 1);
    clip(items[0], range.from, range.to);
    gridWeeks(range);
    expect(items).toEqual(snapshot);
    expect(range).toEqual({ from: '2026-11-01', to: '2026-11-30' });
  });

  it('TZ가 UTC가 아닌 상태에서 실행된다', () => {
    expect(process.env.TZ).not.toBe('UTC');
    expect(new Date(2026, 10, 4).getTimezoneOffset()).not.toBe(0);
  });
});
