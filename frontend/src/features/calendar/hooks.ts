import { useQuery } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { listCalendarTodos } from '../../api/todos';
import { queryKeys, type CalendarParams } from '../../lib/queryKeys';

/** 범위와 겹치는 할일(LP-11: 키에 범위·today 포함) */
export function useCalendarTodos(params: CalendarParams) {
  return useQuery({
    queryKey: queryKeys.calendar.range(params),
    queryFn: () => listCalendarTodos(params),
  });
}

const MOBILE_QUERY = '(max-width: 767px)'; // WA-23 경계 768px

function subscribe(onChange: () => void) {
  const mql = window.matchMedia?.(MOBILE_QUERY);
  mql?.addEventListener('change', onChange);
  return () => mql?.removeEventListener('change', onChange);
}

/** 모바일이면 막대에서 제목을 빼고 탭은 일 뷰로(WA-16) */
export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia?.(MOBILE_QUERY).matches ?? false);
}
