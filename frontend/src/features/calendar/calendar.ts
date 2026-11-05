// 캘린더 순수 함수(FE-13, CP-08). 입력을 변경하지 않으며 날짜는 문자열로만 다룬다(NP-20).
import {
  addDays,
  dayOfWeek,
  diffDays,
  monthRange,
  parseDate,
  WEEKDAYS,
  weekRange,
  type DateRange,
  type DateString,
} from '../../lib/date';
import type { CalendarView } from '../../stores/calendarStore';

/** 기준일·뷰 → 조회 범위(월: 1일~말일, 주: 일~토, 일: 당일) */
export function viewRange(view: CalendarView, base: DateString): DateRange {
  if (view === 'month') return monthRange(base);
  if (view === 'week') return weekRange(base);
  return { from: base, to: base };
}

const dotted = (s: DateString) => s.replaceAll('-', '.');

/** 범위 제목(4번 문서 4.7): '2026년 11월' / '2026.11.01 ~ 11.07' / '2026.11.04 (수)' */
export function viewTitle(view: CalendarView, base: DateString): string {
  if (view === 'month') {
    const { y, m } = parseDate(base);
    return `${y}년 ${m}월`;
  }
  if (view === 'day') return `${dotted(base)} (${WEEKDAYS[dayOfWeek(base)]})`;
  const { from, to } = weekRange(base);
  const sameYear = from.slice(0, 4) === to.slice(0, 4);
  return `${dotted(from)} ~ ${sameYear ? dotted(to.slice(5)) : dotted(to)}`;
}

/** 표시 그리드의 주 시작일 목록(일요일 시작). 월 뷰는 1일·말일이 낀 주 전체 */
export function gridWeeks(range: DateRange): DateString[] {
  const weeks: DateString[] = [];
  for (let w = weekRange(range.from).from; w <= range.to; w = addDays(w, 7)) weeks.push(w);
  return weeks;
}

export interface Clipped {
  start: DateString;
  end: DateString;
  continuesLeft: boolean;
  continuesRight: boolean;
}

/** 할일 기간을 구간으로 자른다. 겹치지 않으면 null(CV-03, CV-05) */
export function clip(
  item: { startDate: DateString; endDate: DateString },
  from: DateString,
  to: DateString,
): Clipped | null {
  if (item.endDate < from || item.startDate > to) return null;
  const start = item.startDate > from ? item.startDate : from;
  const end = item.endDate < to ? item.endDate : to;
  return { start, end, continuesLeft: item.startDate < start, continuesRight: item.endDate > end };
}

export interface Bar<T> extends Clipped {
  item: T;
  /** 0=일요일 열 */
  col: number;
  span: number;
  lane: number;
}

export interface WeekLayout<T> {
  bars: Bar<T>[];
  /** 한도를 넘어 숨긴 막대 수(날짜별, WA-18) */
  hidden: Record<DateString, number>;
}

/**
 * 한 주 행의 막대 배치. 조회 범위(range)와 주를 함께 자르고, 위 칸부터 비어 있는 줄(lane)에 넣는다.
 * lane이 limit 이상인 막대는 숨기고 그 날짜들의 초과 건수를 센다.
 */
export function layoutWeek<T extends { startDate: DateString; endDate: DateString }>(
  items: readonly T[],
  weekStart: DateString,
  range: DateRange,
  limit: number,
): WeekLayout<T> {
  const weekEnd = addDays(weekStart, 6);
  const from = range.from > weekStart ? range.from : weekStart;
  const to = range.to < weekEnd ? range.to : weekEnd;
  const segments = items
    .map((item) => ({ item, c: clip(item, from, to) }))
    .filter((s): s is { item: T; c: Clipped } => s.c !== null)
    // 시작이 빠른 순, 같으면 긴 막대 먼저(입력 순서는 API 정렬을 유지)
    .sort(
      (a, b) =>
        a.c.start.localeCompare(b.c.start) ||
        diffDays(b.c.start, b.c.end) - diffDays(a.c.start, a.c.end),
    );

  const laneEnds: DateString[] = [];
  const bars: Bar<T>[] = [];
  const hidden: Record<DateString, number> = {};
  for (const { item, c } of segments) {
    let lane = laneEnds.findIndex((end) => end < c.start);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = c.end;
    if (lane >= limit) {
      for (let d = c.start; d <= c.end; d = addDays(d, 1)) hidden[d] = (hidden[d] ?? 0) + 1;
      continue;
    }
    const col = diffDays(weekStart, c.start);
    bars.push({ ...c, item, col, span: diffDays(c.start, c.end) + 1, lane });
  }
  return { bars, hidden };
}
