import { fireEvent, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { API, db, err, makeTodo } from '../../../test/handlers';
import { renderApp } from '../../../test/renderWithProviders';
import { server } from '../../../test/server';

const titleInput = () => screen.getByLabelText(/^제목/);
const startInput = () => screen.getByLabelText(/^시작일/);
const endInput = () => screen.getByLabelText(/^종료일/);
const memoInput = () => screen.getByLabelText('메모');
const categorySelect = () => screen.getByLabelText('카테고리');
const save = () => screen.getByRole('button', { name: '저장' });
const writes = () => db.requests.filter((r) => r.method !== 'GET' && r.path.startsWith('/todos'));
const setDate = (input: HTMLElement, value: string) =>
  fireEvent.change(input, { target: { value } });

async function openNew() {
  const view = renderApp('/todos/new');
  await screen.findByRole('heading', { name: '할일 등록' });
  return view;
}

async function fillValid(user: ReturnType<typeof renderApp>['user'], title = '보고서') {
  await user.type(titleInput(), title);
  setDate(startInput(), '2026-11-05');
  setDate(endInput(), '2026-11-06');
}

describe('FE-10 할일 등록/편집', () => {
  it("등록 모드: 카테고리 초기값 '선택 안 함', 기본 카테고리는 목록에 없고 완료 체크가 없다(WA-15)", async () => {
    await openNew();
    const select = categorySelect();
    expect(select).toHaveValue('');
    expect(screen.getByRole('option', { name: '선택 안 함 (기본 카테고리)' })).toHaveProperty(
      'selected',
      true,
    );
    expect(await screen.findByRole('option', { name: '업무' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: '기본' })).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: '완료' })).not.toBeInTheDocument();
  });

  it('편집 모드: 현재 값이 채워지고 완료 체크가 있다(SN-08 1)', async () => {
    const t = makeTodo({
      title: '기획안',
      startDate: '2026-10-28',
      endDate: '2026-11-03',
      categoryId: 2,
      isCompleted: true,
    });
    renderApp(`/todos/${t.id}/edit`);
    await screen.findByRole('heading', { name: '할일 편집' });
    expect(titleInput()).toHaveValue('기획안');
    expect(startInput()).toHaveValue('2026-10-28');
    expect(endInput()).toHaveValue('2026-11-03');
    expect(categorySelect()).toHaveValue('2');
    expect(screen.getByRole('checkbox', { name: '완료' })).toBeChecked();
  });

  it("편집 모드: 기본 카테고리 할일은 '선택 안 함'으로 보인다", async () => {
    const t = makeTodo({
      title: '기본 할일',
      startDate: '2026-11-01',
      endDate: '2026-11-02',
      categoryId: 1,
    });
    renderApp(`/todos/${t.id}/edit`);
    await screen.findByRole('heading', { name: '할일 편집' });
    expect(categorySelect()).toHaveValue('');
    expect(screen.getByRole('checkbox', { name: '완료' })).not.toBeChecked();
  });

  it('제목·시작일·종료일이 비면 각 필드 아래 오류, 요청 없음(BR-04)', async () => {
    const { user } = await openNew();
    await user.type(titleInput(), '   ');
    await user.click(save());
    expect(titleInput()).toHaveAccessibleDescription('[!] 제목을 입력해 주세요.');
    expect(startInput()).toHaveAccessibleDescription('[!] 시작일을 선택해 주세요.');
    expect(endInput()).toHaveAccessibleDescription('[!] 종료일을 선택해 주세요.');
    expect(writes()).toEqual([]);
  });

  it('제목 101자는 오류, 100자는 통과(WA-22)', async () => {
    const { user, router } = await openNew();
    fireEvent.change(titleInput(), { target: { value: 'a'.repeat(101) } });
    setDate(startInput(), '2026-11-05');
    setDate(endInput(), '2026-11-05');
    await user.click(save());
    expect(titleInput()).toHaveAccessibleDescription('[!] 제목은 1~100자로 입력해 주세요.');
    expect(writes()).toEqual([]);

    fireEvent.change(titleInput(), { target: { value: 'a'.repeat(100) } });
    await user.click(save());
    await waitFor(() => expect(router.state.location.pathname).toBe('/todos'));
    expect(writes()).toHaveLength(1);
  });

  it('종료일<시작일은 날짜 변경 즉시 종료일 아래에 표시되고 같은 날이면 사라진다(WA-13)', async () => {
    await openNew();
    setDate(startInput(), '2026-11-05');
    expect(endInput()).not.toHaveAccessibleDescription();
    setDate(endInput(), '2026-11-04');
    expect(endInput()).toHaveAccessibleDescription('[!] 종료일은 시작일보다 빠를 수 없습니다.');
    expect(startInput()).not.toHaveAccessibleDescription();

    setDate(endInput(), '2026-11-05'); // 같은 날 허용(BR-05)
    expect(endInput()).not.toHaveAccessibleDescription();

    setDate(startInput(), '2026-11-06'); // 시작일을 바꿔도 다시 검사
    expect(endInput()).toHaveAccessibleDescription('[!] 종료일은 시작일보다 빠를 수 없습니다.');
    setDate(startInput(), ''); // 한쪽이 비면 비교 오류는 지운다
    expect(endInput()).not.toHaveAccessibleDescription();
  });

  it('저장 시에도 종료일<시작일 오류를 종료일 아래에 표시하고 요청하지 않는다', async () => {
    const { user } = await openNew();
    await user.type(titleInput(), '보고서');
    setDate(startInput(), '2026-11-05');
    setDate(endInput(), '2026-11-04');
    await user.click(save());
    expect(endInput()).toHaveAccessibleDescription('[!] 종료일은 시작일보다 빠를 수 없습니다.');
    expect(writes()).toEqual([]);
  });

  it('필드를 고치면 그 필드의 필수 오류가 사라진다', async () => {
    const { user } = await openNew();
    await user.click(save());
    setDate(endInput(), '2026-11-05');
    expect(endInput()).not.toHaveAccessibleDescription();
    expect(startInput()).toHaveAccessibleDescription('[!] 시작일을 선택해 주세요.');
  });

  it('저장 성공 → 목록 경로 + 목록·캘린더 무효화, 미지정 카테고리는 categoryId null(BR-07)', async () => {
    const { user, router, queryClient } = await openNew();
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    await fillValid(user);
    await user.click(save());
    await waitFor(() => expect(router.state.location.pathname).toBe('/todos'));
    expect(writes()).toEqual([
      {
        method: 'POST',
        path: '/todos',
        search: '',
        body: {
          title: '보고서',
          categoryId: null,
          startDate: '2026-11-05',
          endDate: '2026-11-06',
          memo: '',
        },
      },
    ]);
    expect(spy).toHaveBeenCalledWith({ queryKey: ['todos'] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['calendar'] });
    expect(db.todos.at(-1)?.categoryId).toBe(1);
  });

  it('카테고리를 고르면 그 ID로 저장한다', async () => {
    const { user, router } = await openNew();
    await screen.findByRole('option', { name: '업무' });
    await user.selectOptions(categorySelect(), '업무');
    await fillValid(user);
    await user.click(save());
    await waitFor(() => expect(router.state.location.pathname).toBe('/todos'));
    expect(writes()[0].body).toMatchObject({ categoryId: 2 });
  });

  it('편집 저장은 PUT에 완료 여부를 싣고 목록으로 이동하며 무효화한다', async () => {
    const t = makeTodo({
      title: '기획안',
      startDate: '2026-10-28',
      endDate: '2026-11-03',
      categoryId: 2,
    });
    const { user, router, queryClient } = renderApp(`/todos/${t.id}/edit`);
    await screen.findByRole('heading', { name: '할일 편집' });
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    await user.clear(titleInput());
    await user.type(titleInput(), '기획안 v2');
    await user.selectOptions(categorySelect(), '선택 안 함 (기본 카테고리)');
    await user.click(screen.getByRole('checkbox', { name: '완료' }));
    await user.click(save());
    await waitFor(() => expect(router.state.location.pathname).toBe('/todos'));
    expect(writes()).toEqual([
      {
        method: 'PUT',
        path: `/todos/${t.id}`,
        search: '',
        body: {
          title: '기획안 v2',
          categoryId: null,
          startDate: '2026-10-28',
          endDate: '2026-11-03',
          memo: '',
          isCompleted: true,
        },
      },
    ]);
    expect(spy).toHaveBeenCalledWith({ queryKey: ['todos'] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['calendar'] });
  });

  it('취소는 요청 없이 목록으로 이동한다(WA-14)', async () => {
    const { user, router } = await openNew();
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: '취소' }));
    expect(router.state.location.pathname).toBe('/todos');
    expect(writes()).toEqual([]);
  });

  it('서버 400 fields는 같은 필드 아래에 표시되고 입력값이 유지된다(FR-13)', async () => {
    server.use(
      http.post(`${API}/todos`, () =>
        err(400, 'VALIDATION_ERROR', '입력값을 확인해 주세요.', {
          title: '서버가 거부한 제목입니다.',
          categoryId: '카테고리를 확인해 주세요.',
        }),
      ),
    );
    const { user, router } = await openNew();
    await fillValid(user);
    await user.click(save());
    expect(await screen.findByText('[!] 서버가 거부한 제목입니다.')).toBeInTheDocument();
    expect(titleInput()).toHaveAccessibleDescription('[!] 서버가 거부한 제목입니다.');
    expect(screen.getByText('[!] 카테고리를 확인해 주세요.')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(titleInput()).toHaveValue('보고서');
    expect(router.state.location.pathname).toBe('/todos/new');
  });

  it('서버 오류는 폼 상단 오류 영역에 서버 메시지로 표시되고 입력값이 유지된다(5.4)', async () => {
    server.use(
      http.post(`${API}/todos`, () => err(500, 'INTERNAL_ERROR', '서버 오류가 발생했습니다.')),
    );
    const { user, router } = await openNew();
    await fillValid(user);
    await user.click(save());
    expect(await screen.findByRole('alert')).toHaveTextContent('서버 오류가 발생했습니다.');
    expect(titleInput()).toHaveValue('보고서');
    expect(startInput()).toHaveValue('2026-11-05');
    expect(endInput()).toHaveValue('2026-11-06');
    expect(router.state.location.pathname).toBe('/todos/new');
  });

  it('네트워크 오류는 폼 상단 오류 영역에 공통 문구로 표시되고 입력값이 유지된다', async () => {
    server.use(http.post(`${API}/todos`, () => HttpResponse.error()));
    const { user } = await openNew();
    await fillValid(user);
    await user.click(save());
    expect(await screen.findByRole('alert')).toHaveTextContent(
      '처리하지 못했습니다. 다시 시도해 주세요.',
    );
    expect(titleInput()).toHaveValue('보고서');
  });
});

describe('FE-17 메모', () => {
  it('메모 입력란과 카운터가 표시되고 입력에 따라 갱신된다', async () => {
    const { user } = await openNew();
    expect(memoInput().tagName).toBe('TEXTAREA');
    expect(screen.getByText('0 / 1000')).toBeInTheDocument();
    await user.type(memoInput(), '자료');
    expect(screen.getByText('2 / 1000')).toBeInTheDocument();
  });

  it('1,001자는 요청 없이 메모 아래 오류, 1,000자는 저장된다(WA-22, SN-14 1a)', async () => {
    const { user, router } = await openNew();
    await fillValid(user);
    fireEvent.change(memoInput(), { target: { value: 'a'.repeat(1001) } });
    expect(screen.getByText('1001 / 1000')).toBeInTheDocument();
    await user.click(save());
    expect(memoInput()).toHaveAccessibleDescription('[!] 메모는 1,000자 이하로 입력해 주세요.');
    expect(writes()).toEqual([]);

    fireEvent.change(memoInput(), { target: { value: 'a'.repeat(1000) } });
    await user.click(save());
    await waitFor(() => expect(router.state.location.pathname).toBe('/todos'));
    expect((writes()[0].body as { memo: string }).memo).toHaveLength(1000);
  });

  it('저장 요청에 메모가 실리고, 편집 진입 시 채워지며, 수정 후 재조회해도 유지된다(SN-14)', async () => {
    const { user, router } = await openNew();
    await fillValid(user);
    await user.type(memoInput(), '참고 링크');
    await user.click(save());
    await waitFor(() => expect(router.state.location.pathname).toBe('/todos'));
    expect(writes()[0].body).toMatchObject({ memo: '참고 링크' });

    const id = db.todos.at(-1)!.id;
    await router.navigate(`/todos/${id}/edit`);
    await screen.findByRole('heading', { name: '할일 편집' });
    expect(memoInput()).toHaveValue('참고 링크');
    await user.clear(memoInput());
    await user.type(memoInput(), '수정한 메모');
    await user.click(save());
    await waitFor(() => expect(router.state.location.pathname).toBe('/todos'));

    await router.navigate(`/todos/${id}/edit`);
    await screen.findByRole('heading', { name: '할일 편집' });
    await waitFor(() => expect(memoInput()).toHaveValue('수정한 메모'));
    expect(db.todos.at(-1)?.memo).toBe('수정한 메모');
  });

  it('메모를 비워도 저장된다(SN-14 1b)', async () => {
    const t = makeTodo({
      title: '메모 있음',
      startDate: '2026-11-01',
      endDate: '2026-11-02',
      memo: '지울 메모',
    });
    const { user, router } = renderApp(`/todos/${t.id}/edit`);
    await screen.findByRole('heading', { name: '할일 편집' });
    expect(memoInput()).toHaveValue('지울 메모');
    await user.clear(memoInput());
    await user.click(save());
    await waitFor(() => expect(router.state.location.pathname).toBe('/todos'));
    expect(writes()[0].body).toMatchObject({ memo: '' });
    expect(t.memo).toBeNull();
  });

  it('서버 400의 메모 오류는 메모 필드 아래에 표시된다(FR-13)', async () => {
    server.use(
      http.post(`${API}/todos`, () =>
        err(400, 'VALIDATION_ERROR', '입력값을 확인해 주세요.', {
          memo: '메모는 1,000자 이하로 입력해 주세요.',
        }),
      ),
    );
    const { user } = await openNew();
    await fillValid(user);
    await user.type(memoInput(), '메모');
    await user.click(save());
    await waitFor(() =>
      expect(memoInput()).toHaveAccessibleDescription('[!] 메모는 1,000자 이하로 입력해 주세요.'),
    );
    expect(memoInput()).toHaveValue('메모');
  });
});
