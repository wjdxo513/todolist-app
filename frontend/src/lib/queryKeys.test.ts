import { describe, expect, it } from 'vitest';
import { queryKeys } from './queryKeys';
import { ROUTES } from './routes';

describe('queryKeys (LP-11)', () => {
  it('목록·캘린더 키에 today가 포함된다', () => {
    const list = queryKeys.todos.list({ today: '2026-11-04', page: 2 });
    const cal = queryKeys.calendar.range({
      from: '2026-11-01',
      to: '2026-11-30',
      today: '2026-11-04',
    });
    expect(JSON.stringify(list)).toContain('2026-11-04');
    expect(JSON.stringify(cal)).toContain('"today":"2026-11-04"');
    expect(list[0]).toBe(queryKeys.todos.all[0]);
    expect(cal[0]).toBe(queryKeys.calendar.all[0]);
    expect(queryKeys.todos.detail(3)).toEqual(['todos', 'detail', 3]);
  });
});

describe('ROUTES (LP-14)', () => {
  it('화면 경로를 한 곳에서 만든다', () => {
    expect(ROUTES.todoEdit(7)).toBe('/todos/7/edit');
    expect(ROUTES.login).toBe('/login');
  });
});
