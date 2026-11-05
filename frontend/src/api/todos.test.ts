import { describe, expect, it } from 'vitest';
import { db, makeTodo } from '../test/handlers';
import {
  createTodo,
  deleteTodo,
  getTodo,
  listCalendarTodos,
  listTodos,
  setTodoCompletion,
  updateTodo,
} from './todos';

describe('api/todos (PRE-02, PA-06)', () => {
  it('목록·캘린더 호출은 today 파라미터를 포함한다', async () => {
    makeTodo({ title: 'a', startDate: '2026-11-01', endDate: '2026-11-10' });
    const page = await listTodos({ today: '2026-11-04', categoryId: 1, status: '진행중', page: 1 });
    expect(page.items[0]).toMatchObject({ title: 'a', status: '진행중' });
    const items = await listCalendarTodos({
      from: '2026-11-01',
      to: '2026-11-30',
      today: '2026-11-04',
    });
    expect(items).toHaveLength(1);
    const [list, cal] = db.requests.map((r) => [r.path, new URLSearchParams(r.search)] as const);
    expect(list[0]).toBe('/todos');
    expect(Object.fromEntries(list[1])).toEqual({
      today: '2026-11-04',
      categoryId: '1',
      status: '진행중',
      page: '1',
    });
    expect(cal[0]).toBe('/todos/calendar');
    expect(Object.fromEntries(cal[1])).toEqual({
      from: '2026-11-01',
      to: '2026-11-30',
      today: '2026-11-04',
    });
  });

  it('단건 조회·생성·수정·완료 토글·삭제 경로와 메서드', async () => {
    const body = { title: 'b', categoryId: null, startDate: '2026-11-04', endDate: '2026-11-05' };
    const t = await createTodo(body);
    await expect(getTodo(t.id)).resolves.toMatchObject({ title: 'b' });
    await updateTodo(t.id, { ...body, title: 'c', isCompleted: false });
    await expect(setTodoCompletion(t.id, true)).resolves.toMatchObject({ isCompleted: true });
    await expect(deleteTodo(t.id)).resolves.toBeUndefined();
    expect(db.requests.map((r) => [r.method, r.path, r.body])).toEqual([
      ['POST', '/todos', body],
      ['GET', `/todos/${t.id}`, undefined],
      ['PUT', `/todos/${t.id}`, { ...body, title: 'c', isCompleted: false }],
      ['PATCH', `/todos/${t.id}/completion`, { isCompleted: true }],
      ['DELETE', `/todos/${t.id}`, undefined],
    ]);
  });
});
