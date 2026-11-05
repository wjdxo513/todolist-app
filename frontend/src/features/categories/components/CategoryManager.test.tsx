import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../../../lib/messages';
import { queryKeys } from '../../../lib/queryKeys';
import { useTodoFilterStore } from '../../../stores/todoFilterStore';
import { API, db, err } from '../../../test/handlers';
import { renderApp } from '../../../test/renderWithProviders';
import { server } from '../../../test/server';
import { useCategories } from '../index';

const mutations = () =>
  db.requests.filter((r) => r.method !== 'GET' && r.path.startsWith('/categories'));
const list = () => screen.getByRole('list', { name: '카테고리 목록' });
const row = (name: string) =>
  within(list())
    .getAllByRole('listitem')
    .find((li) => li.textContent?.startsWith(name))!;

async function open() {
  const view = renderApp('/categories');
  await within(await screen.findByRole('list', { name: '카테고리 목록' })).findByText('업무');
  return view;
}

describe('카테고리 관리 (SC-04, FE-09)', () => {
  it('features/categories/index.ts가 useCategories를 공개한다', () => {
    expect(useCategories).toBeTypeOf('function');
  });

  it('기본 카테고리 행에는 수정·삭제 버튼이 없고 수정·삭제 불가 문구가 있다', async () => {
    await open();
    const basic = row('기본');
    expect(basic).toHaveTextContent('(기본)');
    expect(basic).toHaveTextContent('수정·삭제 불가');
    expect(within(basic).queryAllByRole('button')).toHaveLength(0);
    expect(within(row('업무')).getByRole('button', { name: '업무 수정' })).toBeInTheDocument();
    expect(within(row('업무')).getByRole('button', { name: '업무 삭제' })).toBeInTheDocument();
  });

  it.each([
    ['빈 값', ''],
    ['21자', '가'.repeat(21)],
  ])('추가에서 %s은 요청 없이 입력 아래 오류를 표시한다', async (_, value) => {
    const { user } = await open();
    if (value) await user.type(screen.getByLabelText('새 카테고리'), value);
    await user.click(screen.getByRole('button', { name: '추가' }));
    expect(screen.getByLabelText('새 카테고리')).toHaveAccessibleDescription(
      '[!] 이름은 1~20자로 입력해 주세요.',
    );
    expect(mutations()).toHaveLength(0);
  });

  it('추가에서 서버 409(중복)는 입력 아래에 표시되고, 성공하면 행이 추가되고 입력이 비워진다', async () => {
    const { user } = await open();
    const input = screen.getByLabelText('새 카테고리');
    await user.type(input, '업무');
    await user.click(screen.getByRole('button', { name: '추가' }));
    await waitFor(() =>
      expect(input).toHaveAccessibleDescription('[!] 이미 같은 이름의 카테고리가 있습니다.'),
    );
    expect(input).toHaveValue('업무');

    await user.clear(input);
    await user.type(input, '개인');
    await user.click(screen.getByRole('button', { name: '추가' }));
    expect(await within(list()).findByText('개인')).toBeInTheDocument();
    expect(input).toHaveValue('');
    expect(input).not.toHaveAccessibleDescription();
  });

  it('추가 응답 본문을 해석하지 못하면 화면 상단에 공통 문구를 표시한다', async () => {
    server.use(http.post(`${API}/categories`, () => new HttpResponse('not json', { status: 201 })));
    const { user } = await open();
    await user.type(screen.getByLabelText('새 카테고리'), '개인');
    await user.click(screen.getByRole('button', { name: '추가' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(MESSAGES.generic);
  });

  it('추가의 그 외 실패(네트워크)는 화면 상단 오류 영역에 표시한다', async () => {
    server.use(http.post(`${API}/categories`, () => HttpResponse.error()));
    const { user } = await open();
    await user.type(screen.getByLabelText('새 카테고리'), '개인');
    await user.click(screen.getByRole('button', { name: '추가' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(MESSAGES.network);
  });

  it('수정은 인라인 입력으로 전환되고 취소하면 원래대로, 저장하면 이름이 바뀐다', async () => {
    const { user } = await open();
    await user.click(screen.getByRole('button', { name: '업무 수정' }));
    const input = within(list()).getByLabelText("'업무' 새 이름");
    expect(input).toHaveValue('업무');

    await user.click(within(list()).getByRole('button', { name: '취소' }));
    expect(within(list()).queryByRole('textbox')).not.toBeInTheDocument();
    expect(mutations()).toHaveLength(0);

    await user.click(screen.getByRole('button', { name: '업무 수정' }));
    const again = within(list()).getByLabelText("'업무' 새 이름");
    await user.clear(again);
    await user.click(within(list()).getByRole('button', { name: '저장' }));
    expect(again).toHaveAccessibleDescription('[!] 이름은 1~20자로 입력해 주세요.');
    expect(mutations()).toHaveLength(0);

    await user.type(again, '회사');
    await user.click(within(list()).getByRole('button', { name: '저장' }));
    expect(await within(list()).findByText('회사')).toBeInTheDocument();
    expect(within(list()).queryByRole('textbox')).not.toBeInTheDocument();
    expect(mutations()).toEqual([
      { method: 'PATCH', path: '/categories/2', search: '', body: { name: '회사' } },
    ]);
  });

  it('수정 중복 오류는 해당 행 아래에 표시된다', async () => {
    const { user } = await open();
    await user.click(screen.getByRole('button', { name: '업무 수정' }));
    const input = within(list()).getByLabelText("'업무' 새 이름");
    await user.clear(input);
    await user.type(input, '기본');
    await user.click(within(list()).getByRole('button', { name: '저장' }));
    await waitFor(() =>
      expect(input).toHaveAccessibleDescription('[!] 이미 같은 이름의 카테고리가 있습니다.'),
    );
    expect(input.closest('li')).toContainElement(input);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('fields 없는 중복 코드도 행 아래에, 그 외 거부는 화면 상단에 표시한다', async () => {
    server.use(
      http.patch(`${API}/categories/:id`, () =>
        err(409, 'CATEGORY_NAME_DUPLICATE', '중복된 이름입니다.'),
      ),
    );
    const { user } = await open();
    await user.click(screen.getByRole('button', { name: '업무 수정' }));
    const input = within(list()).getByLabelText("'업무' 새 이름");
    await user.type(input, '2');
    await user.click(within(list()).getByRole('button', { name: '저장' }));
    await waitFor(() => expect(input).toHaveAccessibleDescription('[!] 중복된 이름입니다.'));

    server.use(
      http.patch(`${API}/categories/:id`, () =>
        err(409, 'DEFAULT_CATEGORY_PROTECTED', '기본 카테고리는 수정하거나 삭제할 수 없습니다.'),
      ),
    );
    await user.click(within(list()).getByRole('button', { name: '저장' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      '기본 카테고리는 수정하거나 삭제할 수 없습니다.',
    );
    expect(input).not.toHaveAccessibleDescription();
  });

  it('삭제 확인 다이얼로그에 이동 안내가 있고 취소하면 삭제 요청이 없다', async () => {
    const { user } = await open();
    await user.click(screen.getByRole('button', { name: '업무 삭제' }));
    const dialog = screen.getByRole('dialog', { name: '카테고리 삭제' });
    expect(dialog).toHaveTextContent(
      "'업무' 카테고리를 삭제할까요? 소속 할일은 삭제되지 않고 '기본' 카테고리로 이동합니다.",
    );
    await user.click(within(dialog).getByRole('button', { name: '취소' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(within(list()).getByText('업무')).toBeInTheDocument();
    expect(mutations()).toHaveLength(0);
  });

  it('확인하면 행이 제거되고 할일·캘린더 쿼리가 무효화되며 삭제된 카테고리 필터는 전체로 바뀐다', async () => {
    useTodoFilterStore.setState({ categoryId: 2, page: 3 });
    const { user, queryClient } = await open();
    const listKey = queryKeys.todos.list({ today: '2026-11-05', categoryId: 2 });
    const calKey = queryKeys.calendar.range({
      from: '2026-11-01',
      to: '2026-11-30',
      today: '2026-11-05',
    });
    queryClient.setQueryData(listKey, { items: [], page: 1, pageSize: 50, totalCount: 0 });
    queryClient.setQueryData(calKey, { items: [] });

    await user.click(screen.getByRole('button', { name: '업무 삭제' }));
    await user.click(
      within(screen.getByRole('dialog', { name: '카테고리 삭제' })).getByRole('button', {
        name: '삭제',
      }),
    );
    await waitFor(() => expect(within(list()).queryByText('업무')).not.toBeInTheDocument());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mutations()).toEqual([
      { method: 'DELETE', path: '/categories/2', search: '', body: undefined },
    ]);
    expect(queryClient.getQueryState(listKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(calKey)?.isInvalidated).toBe(true);
    expect(useTodoFilterStore.getState().categoryId).toBeNull();
    expect(useTodoFilterStore.getState().page).toBe(1);
  });

  it('다른 카테고리로 필터 중이면 삭제 후에도 필터가 유지된다', async () => {
    db.categories.push({ id: 3, name: '개인', isDefault: false });
    useTodoFilterStore.setState({ categoryId: 3 });
    const { user } = await open();
    await user.click(screen.getByRole('button', { name: '업무 삭제' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '삭제' }));
    await waitFor(() => expect(within(list()).queryByText('업무')).not.toBeInTheDocument());
    expect(useTodoFilterStore.getState().categoryId).toBe(3);
  });

  it.each([
    [
      '409',
      () => err(409, 'CATEGORY_IN_USE', '다른 변경과 충돌했습니다. 다시 시도해 주세요.'),
      '다른 변경과 충돌했습니다. 다시 시도해 주세요.',
    ],
    ['네트워크 실패', () => HttpResponse.error(), MESSAGES.network],
  ])('삭제 직접 요청 거부(%s)는 화면 상단 오류 영역에 표시된다', async (_, resolver, message) => {
    server.use(http.delete(`${API}/categories/:id`, resolver));
    const { user } = await open();
    await user.click(screen.getByRole('button', { name: '업무 삭제' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '삭제' }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(message);
    // 상단 오류 영역: 제목 바로 다음, 목록보다 앞
    expect(screen.getByRole('heading', { name: '카테고리 관리' }).nextElementSibling).toBe(alert);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(within(list()).getByText('업무')).toBeInTheDocument();
  });

  it('목록 조회 실패는 화면 상단에 공통 문구로 표시한다', async () => {
    server.use(http.get(`${API}/categories`, () => err(500, 'INTERNAL_ERROR', '내부 오류')));
    renderApp('/categories');
    expect(await screen.findByRole('alert')).toHaveTextContent(MESSAGES.generic);
  });
});
