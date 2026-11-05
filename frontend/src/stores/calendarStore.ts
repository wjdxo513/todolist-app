// 캘린더 뷰 종류·기준일(LP-12, WA-17). 첫 진입은 월 뷰(D-13).
import { create } from 'zustand';
import { addDays, addMonths, todayLocal, type DateString } from '../lib/date';

export type CalendarView = 'month' | 'week' | 'day';

interface CalendarState {
  view: CalendarView;
  baseDate: DateString;
  setView: (view: CalendarView) => void;
  move: (dir: 1 | -1) => void;
  goToday: () => void;
  /** 날짜 칸·[+N건] 클릭: 그 날짜의 일 뷰(WA-16, WA-18) */
  openDay: (date: DateString) => void;
}

const step = (view: CalendarView, date: DateString, dir: 1 | -1): DateString =>
  view === 'month' ? addMonths(date, dir) : addDays(date, view === 'week' ? 7 * dir : dir);

export const useCalendarStore = create<CalendarState>()((set) => ({
  view: 'month',
  baseDate: todayLocal(),
  setView: (view) => set({ view }),
  move: (dir) => set((s) => ({ baseDate: step(s.view, s.baseDate, dir) })),
  goToday: () => set({ baseDate: todayLocal() }),
  openDay: (date) => set({ view: 'day', baseDate: date }),
}));
