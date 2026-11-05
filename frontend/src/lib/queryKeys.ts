// 쿼리 키 팩토리(LP-11). 상태가 today에 의존하는 목록·캘린더 키는 today를 포함한다.
import type { DateString } from './date';

export interface TodoListParams {
  today: DateString;
  categoryId?: number;
  status?: string;
  page?: number;
}

export interface CalendarParams {
  from: DateString;
  to: DateString;
  today: DateString;
}

export const queryKeys = {
  me: ['me'] as const,
  categories: ['categories'] as const,
  todos: {
    all: ['todos'] as const,
    list: (p: TodoListParams) => ['todos', 'list', p] as const,
    detail: (id: number) => ['todos', 'detail', id] as const,
  },
  calendar: {
    all: ['calendar'] as const,
    range: (p: CalendarParams) => ['calendar', p] as const,
  },
};
