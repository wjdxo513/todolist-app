// 날짜는 끝까지 'YYYY-MM-DD' 문자열(CP-03). 계산은 정수 연·월·일로만 하고 타임존 해석을 하지 않는다(NP-20).
export type DateString = string;

const pad = (n: number, len = 2) => String(n).padStart(len, '0');

export function toDateString(y: number, m: number, d: number): DateString {
  return `${pad(y, 4)}-${pad(m)}-${pad(d)}`;
}

export function parseDate(s: DateString): { y: number; m: number; d: number } {
  const [y, m, d] = s.split('-').map(Number);
  return { y, m, d };
}

/** 클라이언트 로컬 날짜(NP-21). 서버 시계 대신 이 값을 today로 보낸다. */
export function todayLocal(now: Date = new Date()): DateString {
  return toDateString(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

// Date.UTC는 정수 연·월·일을 넘침 보정(월말·연말·윤년)만 시키는 계산기로 쓴다
function fromUtc(ms: number): DateString {
  const dt = new Date(ms);
  return toDateString(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

export function addDays(s: DateString, n: number): DateString {
  const { y, m, d } = parseDate(s);
  return fromUtc(Date.UTC(y, m - 1, d + n));
}

export function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** 월 이동. 일은 그 달의 말일을 넘지 않게 맞춘다(01-31 + 1개월 = 02-28). */
export function addMonths(s: DateString, n: number): DateString {
  const { y, m, d } = parseDate(s);
  const total = y * 12 + (m - 1) + n;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return toDateString(ny, nm, Math.min(d, daysInMonth(ny, nm)));
}

/** 0 = 일요일 … 6 = 토요일 */
export function dayOfWeek(s: DateString): number {
  const { y, m, d } = parseDate(s);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function diffDays(from: DateString, to: DateString): number {
  const a = parseDate(from);
  const b = parseDate(to);
  return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86_400_000);
}

export interface DateRange {
  from: DateString;
  to: DateString;
}

/** 주는 일~토(AS-09) */
export function weekRange(s: DateString): DateRange {
  const from = addDays(s, -dayOfWeek(s));
  return { from, to: addDays(from, 6) };
}

export function monthRange(s: DateString): DateRange {
  const { y, m } = parseDate(s);
  return { from: toDateString(y, m, 1), to: toDateString(y, m, daysInMonth(y, m)) };
}

export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

/** 목록·캘린더의 짧은 표기(WA-24): 올해면 MM-DD, 아니면 YYYY-MM-DD */
export function formatShort(s: DateString, today: DateString): string {
  return s.slice(0, 4) === today.slice(0, 4) ? s.slice(5) : s;
}
