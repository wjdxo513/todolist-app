import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { MESSAGES } from '../../lib/messages';
import { API, db, makeTodo } from '../../test/handlers';
import { renderApp, renderWithProviders } from '../../test/renderWithProviders';
import { server } from '../../test/server';
import { AppHeader } from './AppHeader';

const nav = () => screen.getByRole('navigation', { name: '주 메뉴' });

describe('공통 헤더 (FE-07)', () => {
  it('내비 4개와 사용자 이름이 있고 현재 항목이 강조된다', async () => {
    const { queryClient } = renderApp('/categories');
    expect(await screen.findByText('홍길동님')).toBeInTheDocument();
    const links = within(nav()).getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual(['할일 목록', '캘린더', '카테고리', '내 정보']);
    const current = within(nav()).getByRole('link', { name: '카테고리' });
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current).toHaveClass('active');
    for (const name of ['할일 목록', '캘린더', '내 정보']) {
      const link = within(nav()).getByRole('link', { name });
      expect(link).not.toHaveAttribute('aria-current');
      expect(link).not.toHaveClass('active');
    }
    await waitFor(() => expect(queryClient.isFetching()).toBe(0));
  });

  it.each(['/todos/new', '/todos/7/edit'])('SC-06(%s)에서는 할일 목록이 강조된다', async (path) => {
    const { queryClient } = renderApp(path);
    await screen.findByText('홍길동님');
    expect(within(nav()).getByRole('link', { name: '할일 목록' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await waitFor(() => expect(queryClient.isFetching()).toBe(0));
  });

  it('캘린더 화면은 넓은 본문 폭을 쓴다', async () => {
    const { queryClient } = renderApp('/calendar');
    await screen.findByText('홍길동님');
    expect(within(nav()).getByRole('link', { name: '캘린더' })).toHaveClass('active');
    expect(screen.getByRole('main')).toHaveAttribute('data-wide', 'true');
    await waitFor(() => expect(queryClient.isFetching()).toBe(0));
  });

  it('모바일 [=] 메뉴가 열리고 닫히며 항목 선택 시 닫힌다. 로그아웃 버튼은 항상 있다', async () => {
    const { user, router, queryClient } = renderApp('/todos');
    const menu = await screen.findByRole('button', { name: '메뉴' });
    expect(menu).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: '로그아웃' })).toBeInTheDocument();

    await user.click(menu);
    expect(menu).toHaveAttribute('aria-expanded', 'true');
    expect(nav()).toHaveAttribute('data-open', 'true');
    expect(screen.getByRole('button', { name: '로그아웃' })).toBeInTheDocument();

    await user.click(menu);
    expect(menu).toHaveAttribute('aria-expanded', 'false');
    expect(nav()).not.toHaveAttribute('data-open');

    await user.click(menu);
    await user.click(within(nav()).getByRole('link', { name: '내 정보' }));
    expect(router.state.location.pathname).toBe('/profile');
    expect(menu).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: '로그아웃' })).toBeInTheDocument();
    await waitFor(() => expect(queryClient.isFetching()).toBe(0));
  });

  it('사용자 이름이 없으면 이름 영역을 그리지 않고 로그아웃 콜백을 호출한다', async () => {
    const onLogout = vi.fn();
    const { user } = renderWithProviders(<AppHeader onLogout={onLogout} />);
    expect(screen.queryByText(/님$/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '로그아웃' }));
    expect(onLogout).toHaveBeenCalledOnce();
  });
});

describe('로그아웃 (FE-07)', () => {
  it('204 성공 시 갱신 요청 없이 로그인 화면으로 가고 서버 데이터 캐시가 비워진다', async () => {
    makeTodo({ title: '이전 사용자 할일', startDate: '2026-11-01', endDate: '2026-11-30' });
    const { user, router, queryClient } = renderApp('/todos');
    expect(await screen.findByText('이전 사용자 할일')).toBeInTheDocument();
    await waitFor(() => expect(queryClient.isFetching()).toBe(0));

    await user.click(screen.getByRole('button', { name: '로그아웃' }));
    expect(await screen.findByRole('heading', { name: '로그인' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');

    const logoutAt = db.requests.findIndex((r) => r.path === '/auth/logout');
    expect(logoutAt).toBeGreaterThanOrEqual(0);
    await waitFor(() => expect(queryClient.isFetching()).toBe(0));
    expect(db.requests.slice(logoutAt + 1)).toEqual([]); // 갱신·재조회 요청 없음(AD-13)

    expect(queryClient.getQueryData(['me'])).toBeNull();
    const leftovers = queryClient
      .getQueryCache()
      .getAll()
      .filter((q) => q.queryKey[0] !== 'me' && q.state.data !== undefined);
    expect(leftovers).toEqual([]);
    expect(screen.queryByText('이전 사용자 할일')).not.toBeInTheDocument();
    expect(screen.queryByText(MESSAGES.sessionExpired, { exact: false })).not.toBeInTheDocument();
  });

  it.each([
    ['500', () => new HttpResponse(null, { status: 500 })],
    ['네트워크 실패', () => HttpResponse.error()],
  ])(
    '로그아웃 요청 실패(%s) 시 이동하지 않고 헤더 아래 오류 영역에 표시한다',
    async (_, resolver) => {
      server.use(http.post(`${API}/auth/logout`, resolver));
      const { user, router, queryClient } = renderApp('/todos');
      await screen.findByText('홍길동님');
      await waitFor(() => expect(queryClient.isFetching()).toBe(0));

      await user.click(screen.getByRole('button', { name: '로그아웃' }));
      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(MESSAGES.logoutFailed);
      expect(screen.getByRole('banner').nextElementSibling).toContainElement(alert);
      expect(router.state.location.pathname).toBe('/todos');
      expect(screen.getByText('홍길동님')).toBeInTheDocument();
    },
  );
});
