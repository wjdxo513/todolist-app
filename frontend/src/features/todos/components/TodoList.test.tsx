import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTodoFilterStore } from '../../../stores/todoFilterStore';
import { API, db, err, makeTodo } from '../../../test/handlers';
import { renderApp } from '../../../test/renderWithProviders';
import { server } from '../../../test/server';

const TODAY = '2026-11-04';

/** 목록 요청 쿼리들 */
const listQueries = () =>
  db.requests
    .filter((r) => r.method === 'GET' && r.path === '/todos')
    .map((r) => Object.fromEntries(new URLSearchParams(r.search)));
const lastListQuery = () => listQueries().at(-1);
const writes = () => db.requests.filter((r) => r.method !== 'GET' && r.path.startsWith('/todos'));
const rowOf = (title: string) =>
  screen.getByRole('button', { name: title }).closest('li') as HTMLElement;
const seedMany = (n: number) =>
  Array.from({ length: n }, (_, i) =>
    makeTodo({
      title: `T${String(i + 1).padStart(2, '0')}`,
      startDate: '2026-11-05',
      endDate: '2026-11-06',
    }),
  );

async function openList() {
  const view = renderApp('/todos');
  await screen.findByRole('heading', { name: '할일 목록' });
  await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
  return view;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 4, 12, 0));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('FE-11 목록 조회·필터·페이지', () => {
  it('목록 요청과 쿼리 키에 todayLocal()이 today로 포함된다(PA-06, LP-11)', async () => {
    const { queryClient } = await openList();
    expect(lastListQuery()).toEqual({ today: TODAY, page: '1' });
    const keys = queryClient
      .getQueryCache()
      .findAll({ queryKey: ['todos', 'list'] })
      .map((q) => q.queryKey);
    expect(keys).toEqual([['todos', 'list', { today: TODAY, page: 1 }]]);
  });

  it('행은 API의 status를 그대로 StatusBadge로 표시한다(LP-13)', async () => {
    const t = makeTodo({
      title: '미래 할일',
      startDate: '2026-12-01',
      endDate: '2026-12-02',
      categoryId: 2,
    });
    // 날짜로는 '시작 전'이지만 서버가 준 값만 표시하는지 본다
    server.use(
      http.get(`${API}/todos`, () =>
        HttpResponse.json({
          items: [{ ...t, status: '기한 초과' }],
          page: 1,
          pageSize: 50,
          totalCount: 1,
        }),
      ),
    );
    await openList();
    const row = rowOf('미래 할일');
    expect(within(row).getByText('기한 초과', { exact: false })).toHaveTextContent('(!) 기한 초과');
    expect(row).not.toHaveTextContent('시작 전');
    expect(row).toHaveTextContent('12-01 ~ 12-02');
    expect(await within(row).findByText('업무')).toBeInTheDocument();
  });

  it('올해가 아닌 날짜는 연도를 붙인다(WA-24)', async () => {
    makeTodo({ title: '연말', startDate: '2025-12-30', endDate: '2026-01-02' });
    await openList();
    expect(rowOf('연말')).toHaveTextContent('2025-12-30 ~ 01-02');
  });

  it("상태 필터는 하나만 선택되고 카테고리와 함께 요청되며 '전체'가 해제이다(WA-09)", async () => {
    makeTodo({
      title: '업무 완료',
      startDate: '2026-11-01',
      endDate: '2026-11-02',
      categoryId: 2,
      isCompleted: true,
    });
    makeTodo({ title: '기본 진행', startDate: '2026-11-01', endDate: '2026-11-05' });
    const { user } = await openList();
    const radio = (name: string) => screen.getByRole('radio', { name });
    expect(radio('전체')).toBeChecked();

    await user.click(radio('완료'));
    expect(radio('완료')).toBeChecked();
    expect(
      screen.getAllByRole('radio').filter((r) => (r as HTMLInputElement).checked),
    ).toHaveLength(1);
    await waitFor(() =>
      expect(lastListQuery()).toEqual({ today: TODAY, status: '완료', page: '1' }),
    );

    await screen.findByRole('option', { name: '업무' });
    await user.selectOptions(screen.getByRole('combobox', { name: /^카테고리/ }), '업무');
    await waitFor(() =>
      expect(lastListQuery()).toEqual({ today: TODAY, categoryId: '2', status: '완료', page: '1' }),
    );
    expect(await screen.findByRole('button', { name: '업무 완료' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '기본 진행' })).not.toBeInTheDocument();

    await user.click(radio('진행중'));
    expect(radio('완료')).not.toBeChecked();
    await waitFor(() =>
      expect(lastListQuery()).toMatchObject({ status: '진행중', categoryId: '2' }),
    );

    await user.click(radio('전체'));
    await waitFor(() =>
      expect(lastListQuery()).toEqual({ today: TODAY, categoryId: '2', page: '1' }),
    );

    await user.selectOptions(screen.getByRole('combobox', { name: /^카테고리/ }), '전체');
    await waitFor(() => expect(lastListQuery()).toEqual({ today: TODAY, page: '1' }));
  });

  it('모바일 상태 드롭다운도 같은 필터를 바꾸고 전체가 해제이다', async () => {
    const { user } = await openList();
    const select = screen.getByRole('combobox', { name: /^상태 선택/ });
    await user.selectOptions(select, '기한 초과');
    expect(screen.getByRole('radio', { name: '기한 초과' })).toBeChecked();
    await waitFor(() => expect(lastListQuery()).toMatchObject({ status: '기한 초과' }));
    await user.selectOptions(select, '전체');
    expect(useTodoFilterStore.getState().status).toBeNull();
  });

  it('필터를 바꾸면 페이지가 1로 돌아간다', async () => {
    seedMany(60);
    const { user } = await openList();
    await user.click(screen.getByRole('button', { name: '2페이지' }));
    await waitFor(() => expect(lastListQuery()).toMatchObject({ page: '2' }));
    await user.click(screen.getByRole('radio', { name: '시작 전' }));
    await waitFor(() =>
      expect(lastListQuery()).toEqual({ today: TODAY, status: '시작 전', page: '1' }),
    );

    await user.click(screen.getByRole('button', { name: '2페이지' }));
    await user.selectOptions(screen.getByRole('combobox', { name: /^카테고리/ }), '기본');
    await waitFor(() => expect(lastListQuery()).toMatchObject({ categoryId: '1', page: '1' }));
  });

  it('50건 이하면 페이지 이동이 없다', async () => {
    seedMany(50);
    await openList();
    expect(screen.getAllByRole('checkbox')).toHaveLength(50);
    expect(screen.queryByRole('navigation', { name: '페이지 이동' })).not.toBeInTheDocument();
  });

  it('50건 초과면 페이지 이동이 보이고 이전·다음이 해당 page로 요청한다(5.5)', async () => {
    seedMany(51);
    const { user } = await openList();
    const nav = () => screen.getByRole('navigation', { name: '페이지 이동' });
    await user.click(within(nav()).getByRole('button', { name: '다음 >' }));
    await waitFor(() => expect(lastListQuery()).toEqual({ today: TODAY, page: '2' }));
    expect(await screen.findByRole('button', { name: 'T51' })).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox')).toHaveLength(1);

    await user.click(within(nav()).getByRole('button', { name: '< 이전' }));
    await waitFor(() => expect(lastListQuery()).toEqual({ today: TODAY, page: '1' }));
    expect(await screen.findByRole('button', { name: 'T01' })).toBeInTheDocument();
  });

  it('할일이 하나도 없으면 첫 할일 안내와 [+ 새 할일]이 표시된다(5.6)', async () => {
    const { user, router } = await openList();
    expect(
      screen.getByText('아직 등록한 할일이 없습니다. 첫 할일을 등록해 보세요.'),
    ).toBeInTheDocument();
    const buttons = screen.getAllByRole('button', { name: '+ 새 할일' });
    expect(buttons).toHaveLength(2); // 머리글 + 빈 상태
    await user.click(buttons[1]);
    expect(router.state.location.pathname).toBe('/todos/new');
  });

  it("필터 결과가 없으면 '조건에 맞는 할일이 없습니다.'와 필터 컨트롤이 표시된다", async () => {
    makeTodo({ title: '진행', startDate: '2026-11-01', endDate: '2026-11-05' });
    const { user } = await openList();
    await user.click(screen.getByRole('radio', { name: '완료' }));
    expect(await screen.findByText('조건에 맞는 할일이 없습니다.')).toBeInTheDocument();
    expect(screen.queryByText(/첫 할일을 등록해 보세요/)).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /^카테고리/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '완료' })).toBeChecked();
  });

  it('조회 실패 시 본문 상단 오류 영역에 공통 문구(5.4)', async () => {
    server.use(http.get(`${API}/todos`, () => err(500, 'INTERNAL_ERROR', '서버 오류')));
    renderApp('/todos');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      '처리하지 못했습니다. 다시 시도해 주세요.',
    );
    expect(screen.queryByText(/첫 할일을 등록해 보세요/)).not.toBeInTheDocument();
  });

  it('[+ 새 할일]·제목·[편집]이 SC-06 경로로 이동한다(WA-10, WA-12)', async () => {
    const t = makeTodo({ title: '기획안', startDate: '2026-10-28', endDate: '2026-11-03' });
    const { user, router } = await openList();
    await user.click(screen.getByRole('button', { name: '+ 새 할일' }));
    expect(router.state.location.pathname).toBe('/todos/new');

    await router.navigate('/todos');
    await user.click(await screen.findByRole('button', { name: '기획안' }));
    expect(router.state.location.pathname).toBe(`/todos/${t.id}/edit`);

    await router.navigate('/todos');
    await user.click(await screen.findByRole('button', { name: '기획안 편집' }));
    expect(router.state.location.pathname).toBe(`/todos/${t.id}/edit`);
  });

  it('정렬 안내 문구가 있고 정렬 변경 수단은 없다(4.5)', async () => {
    await openList();
    expect(screen.getByText('정렬: 종료일 빠른 순 (같으면 먼저 만든 순)')).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: /정렬/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /정렬/ })).not.toBeInTheDocument();
    expect(screen.getAllByRole('combobox')).toHaveLength(2); // 카테고리 + 모바일 상태
  });
});

describe('FE-12 완료 토글·삭제', () => {
  it('토글 클릭 시 요청 1회, 성공 후 상태 배지가 갱신된다(FR-07)', async () => {
    const t = makeTodo({ title: '기획안', startDate: '2026-11-01', endDate: '2026-11-05' });
    const { user } = await openList();
    expect(rowOf('기획안')).toHaveTextContent('진행중');
    await user.click(screen.getByRole('checkbox', { name: '기획안 완료' }));
    await waitFor(() => expect(rowOf('기획안')).toHaveTextContent('(v) 완료'));
    expect(screen.getByRole('checkbox', { name: '기획안 완료' })).toBeChecked();
    expect(writes()).toEqual([
      {
        method: 'PATCH',
        path: `/todos/${t.id}/completion`,
        search: '',
        body: { isCompleted: true },
      },
    ]);
  });

  it('토글 실패 시 이전 상태로 돌아가고 오류 영역에 표시된다(WA-10)', async () => {
    makeTodo({ title: '기획안', startDate: '2026-11-01', endDate: '2026-11-05' });
    let fail!: () => void;
    const gate = new Promise<void>((r) => (fail = r));
    server.use(
      http.patch(`${API}/todos/:id/completion`, async () => {
        await gate;
        return err(500, 'INTERNAL_ERROR', '서버 오류');
      }),
    );
    const { user } = await openList();
    const box = screen.getByRole('checkbox', { name: '기획안 완료' });
    await user.click(box);
    expect(box).toBeChecked(); // 저장 중엔 누른 값
    fail();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      '처리하지 못했습니다. 다시 시도해 주세요.',
    );
    expect(screen.getByRole('checkbox', { name: '기획안 완료' })).not.toBeChecked();
    expect(rowOf('기획안')).toHaveTextContent('진행중');
  });

  it("'완료' 필터에서 완료를 해제하면 행이 사라진다(SN-09 3b)", async () => {
    makeTodo({
      title: '끝낸 일',
      startDate: '2026-11-01',
      endDate: '2026-11-02',
      isCompleted: true,
    });
    makeTodo({
      title: '다른 완료',
      startDate: '2026-11-01',
      endDate: '2026-11-03',
      isCompleted: true,
    });
    useTodoFilterStore.setState({ status: '완료' });
    const { user } = await openList();
    await user.click(screen.getByRole('checkbox', { name: '끝낸 일 완료' }));
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: '끝낸 일' })).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('button', { name: '다른 완료' })).toBeInTheDocument();
  });

  it('삭제 다이얼로그: 취소하면 요청 없음, 확인하면 요청 후 행이 사라지고 목록·캘린더 무효화(BR-11, SN-10)', async () => {
    const t = makeTodo({ title: '기획안', startDate: '2026-11-01', endDate: '2026-11-05' });
    makeTodo({ title: '남는 일', startDate: '2026-11-01', endDate: '2026-11-06' });
    const { user, queryClient } = await openList();
    const spy = vi.spyOn(queryClient, 'invalidateQueries');

    await user.click(screen.getByRole('button', { name: '기획안 삭제' }));
    const dialog = screen.getByRole('dialog', { name: '할일 삭제' });
    expect(dialog).toHaveTextContent("'기획안'을(를) 삭제할까요? 삭제하면 복구할 수 없습니다.");
    await user.click(within(dialog).getByRole('button', { name: '취소' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(writes()).toEqual([]);
    expect(screen.getByRole('button', { name: '기획안' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '기획안 삭제' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '삭제' }));
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: '기획안' })).not.toBeInTheDocument(),
    );
    expect(writes()).toEqual([
      { method: 'DELETE', path: `/todos/${t.id}`, search: '', body: undefined },
    ]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '남는 일' })).toBeInTheDocument();
    expect(spy).toHaveBeenCalledWith({ queryKey: ['todos'] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['calendar'] });
  });

  it('삭제 실패 시 행이 유지되고 오류 영역에 표시된다(5.4)', async () => {
    makeTodo({ title: '기획안', startDate: '2026-11-01', endDate: '2026-11-05' });
    server.use(http.delete(`${API}/todos/:id`, () => err(500, 'INTERNAL_ERROR', '서버 오류')));
    const { user } = await openList();
    await user.click(screen.getByRole('button', { name: '기획안 삭제' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '삭제' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      '처리하지 못했습니다. 다시 시도해 주세요.',
    );
    expect(screen.getByRole('button', { name: '기획안' })).toBeInTheDocument();
  });

  it('현재 페이지의 마지막 항목을 지워 페이지가 비면 이전 페이지로 이동한다(WA-11)', async () => {
    seedMany(51);
    const { user } = await openList();
    await user.click(screen.getByRole('button', { name: '2페이지' }));
    await user.click(await screen.findByRole('button', { name: 'T51 삭제' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '삭제' }));
    await waitFor(() => expect(useTodoFilterStore.getState().page).toBe(1));
    await waitFor(() => expect(lastListQuery()).toEqual({ today: TODAY, page: '1' }));
    expect(await screen.findByRole('button', { name: 'T01' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: '페이지 이동' })).not.toBeInTheDocument();
    expect(screen.queryByText('조건에 맞는 할일이 없습니다.')).not.toBeInTheDocument();
  });

  it('1페이지에서 항목을 지우면 페이지는 그대로다', async () => {
    seedMany(2);
    const { user } = await openList();
    await user.click(screen.getByRole('button', { name: 'T01 삭제' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '삭제' }));
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'T01' })).not.toBeInTheDocument(),
    );
    expect(useTodoFilterStore.getState().page).toBe(1);
  });
});
