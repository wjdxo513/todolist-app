import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { logIn } from '../api/auth';
import { listCategories } from '../api/categories';
import { listTodos } from '../api/todos';
import { getMe } from '../api/users';
import { queryKeys } from '../lib/queryKeys';
import { useCalendarStore } from '../stores/calendarStore';
import { useSessionStore } from '../stores/sessionStore';
import { useTodoFilterStore } from '../stores/todoFilterStore';
import { API, db, err, makeTodo } from '../test/handlers';
import { server } from '../test/server';
import { createQueryClient, isRetryable } from './queryClient';

function setup() {
  const onUnauthenticated = vi.fn();
  const client = createQueryClient({ onUnauthenticated, retryDelay: 0 });
  const onError = vi.spyOn(client.getQueryCache().config, 'onError');
  return { client, onUnauthenticated, onError };
}

type Client = ReturnType<typeof setup>['client'];

const fetchCategories = (client: Client) =>
  client.fetchQuery({ queryKey: queryKeys.categories, queryFn: listCategories });

const mutate = (client: Client, mutationFn: () => Promise<unknown>) =>
  client.getMutationCache().build(client, { mutationFn }).execute(undefined);

const isExpired = () => useSessionStore.getState().isExpired;

describe('401 전역 처리 (LP-09, WA-21)', () => {
  it('Access 만료 401이 갱신·재시도로 성공하면 onError·플래그·이동이 없다(SN-15)', async () => {
    const { client, onUnauthenticated, onError } = setup();
    client.setQueryData(queryKeys.me, db.user);
    server.use(
      http.get(`${API}/categories`, () => err(401, 'UNAUTHENTICATED', 'x'), { once: true }),
    );
    await expect(fetchCategories(client)).resolves.toHaveLength(2);
    expect(db.requests.map((r) => r.path)).toEqual(['/auth/refresh', '/categories']);
    expect(onError).not.toHaveBeenCalled();
    expect(onUnauthenticated).not.toHaveBeenCalled();
    expect(isExpired()).toBe(false);
  });

  it('인증된 상태에서 갱신까지 실패한 401이면 플래그 켜기·캐시 비우기·이동', async () => {
    const { client, onUnauthenticated } = setup();
    const listKey = queryKeys.todos.list({ today: '2026-11-04' });
    client.setQueryData(queryKeys.me, db.user);
    client.setQueryData(listKey, { items: [] });
    db.isLoggedIn = false;
    await expect(fetchCategories(client)).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHENTICATED',
    });
    expect(isExpired()).toBe(true);
    expect(client.getQueryData(listKey)).toBeUndefined();
    expect(client.getQueryData(queryKeys.categories)).toBeUndefined();
    expect(client.getQueryData(queryKeys.me)).toBeNull();
    expect(onUnauthenticated).toHaveBeenCalledTimes(1);
  });

  it('현재 사용자 캐시가 없으면 플래그 없이 이동만 한다(SN-03)', async () => {
    const { client, onUnauthenticated } = setup();
    db.isLoggedIn = false;
    await expect(fetchCategories(client)).rejects.toMatchObject({ status: 401 });
    expect(isExpired()).toBe(false);
    expect(onUnauthenticated).toHaveBeenCalledTimes(1);
  });

  it('캐시 없이 me 조회의 401은 가드(RequireAuth)에 맡겨 여기서 이동하지 않는다', async () => {
    const { client, onUnauthenticated } = setup();
    db.isLoggedIn = false;
    await expect(
      client.fetchQuery({ queryKey: queryKeys.me, queryFn: getMe }),
    ).rejects.toMatchObject({ status: 401 });
    expect(onUnauthenticated).not.toHaveBeenCalled();
    expect(isExpired()).toBe(false);
  });

  it('뮤테이션의 401 UNAUTHENTICATED도 같은 처리를 한다', async () => {
    const { client, onUnauthenticated } = setup();
    client.setQueryData(queryKeys.me, db.user);
    db.isLoggedIn = false;
    await expect(mutate(client, listCategories)).rejects.toMatchObject({ status: 401 });
    expect(isExpired()).toBe(true);
    expect(onUnauthenticated).toHaveBeenCalledTimes(1);
  });

  it('로그인 실패 401 INVALID_CREDENTIALS는 이동·재시도하지 않는다', async () => {
    const { client, onUnauthenticated } = setup();
    await expect(
      mutate(client, () => logIn({ email: 'hong@example.com', password: 'wrong-pass' })),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    expect(db.requests).toHaveLength(1);
    expect(onUnauthenticated).not.toHaveBeenCalled();
    expect(isExpired()).toBe(false);
  });
});

describe('재시도 규칙 (LP-10, TP-15)', () => {
  const countCalls = (res: () => Response) => {
    let calls = 0;
    server.use(
      http.get(`${API}/categories`, () => {
        calls += 1;
        return res();
      }),
    );
    return () => calls;
  };

  it.each([
    [401, 'INVALID_CREDENTIALS'],
    [400, 'VALIDATION_ERROR'],
    [404, 'NOT_FOUND'],
    [409, 'CATEGORY_NAME_DUPLICATE'],
  ])('%i %s 는 재시도·이동하지 않는다', async (status, code) => {
    const { client, onUnauthenticated } = setup();
    client.setQueryData(queryKeys.me, db.user);
    const calls = countCalls(() => err(status, code, 'x'));
    await expect(fetchCategories(client)).rejects.toMatchObject({ status, code });
    expect(calls()).toBe(1);
    expect(onUnauthenticated).not.toHaveBeenCalled();
    expect(isExpired()).toBe(false);
  });

  it.each([
    ['500', () => err(500, 'INTERNAL_ERROR', 'x')],
    ['503', () => err(503, 'UNAVAILABLE', 'x')],
    ['네트워크 오류', () => HttpResponse.error()],
  ])('%s 는 재시도한다', async (_, res) => {
    const { client, onUnauthenticated } = setup();
    const calls = countCalls(res);
    await expect(fetchCategories(client)).rejects.toBeDefined();
    expect(calls()).toBe(3);
    expect(onUnauthenticated).not.toHaveBeenCalled();
  });

  it('ApiError가 아닌 오류는 재시도 대상이고, 뮤테이션은 재시도하지 않는다', () => {
    expect(isRetryable(new Error('x'))).toBe(true);
    const client = createQueryClient({ onUnauthenticated: vi.fn() });
    expect(client.getDefaultOptions().mutations?.retry).toBe(false);
    expect(client.getDefaultOptions().queries?.retryDelay).toBeUndefined();
  });
});

describe('서버 데이터는 Zustand에 두지 않는다 (LP-12)', () => {
  it('조회 후에도 스토어 상태 키는 UI 상태뿐이다', async () => {
    const { client } = setup();
    makeTodo({ title: '기획안', startDate: '2026-11-01', endDate: '2026-11-05' });
    await client.fetchQuery({ queryKey: queryKeys.me, queryFn: getMe });
    await client.fetchQuery({
      queryKey: queryKeys.todos.list({ today: '2026-11-04' }),
      queryFn: () => listTodos({ today: '2026-11-04' }),
    });
    const dataKeys = (o: object) =>
      Object.entries(o)
        .filter(([, v]) => typeof v !== 'function')
        .map(([k]) => k)
        .sort();
    expect(dataKeys(useTodoFilterStore.getState())).toEqual(['categoryId', 'page', 'status']);
    expect(dataKeys(useCalendarStore.getState())).toEqual(['baseDate', 'view']);
    expect(dataKeys(useSessionStore.getState())).toEqual(['isExpired']);
    const states = [useTodoFilterStore, useCalendarStore, useSessionStore].map((s) => s.getState());
    expect(JSON.stringify(states)).not.toMatch(/기획안|홍길동|hong@example/);
  });
});
