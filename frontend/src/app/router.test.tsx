import { screen, waitFor } from '@testing-library/react';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../lib/messages';
import { ProfilePage } from '../pages/ProfilePage';
import { API, db, err } from '../test/handlers';
import { renderApp, renderWithProviders } from '../test/renderWithProviders';
import { server } from '../test/server';

describe('라우트 가드 (FE-07)', () => {
  it.each(['/profile', '/categories', '/todos', '/todos/new', '/todos/3/edit', '/calendar'])(
    '미인증(현재 사용자 401 + 갱신 실패)으로 %s 직접 접근 시 로그인 화면으로 가고 만료 안내는 없다',
    async (path) => {
      db.isLoggedIn = false;
      const { router } = renderApp(path);
      expect(await screen.findByRole('heading', { name: '로그인' })).toBeInTheDocument();
      expect(router.state.location.pathname).toBe('/login');
      expect(screen.queryByText(MESSAGES.sessionExpired, { exact: false })).not.toBeInTheDocument();
      // 갱신을 한 번 시도했고 실패했다(SN-03)
      expect(db.requests.filter((r) => r.path === '/auth/refresh')).toHaveLength(1);
    },
  );

  it.each(['/login', '/signup'])(
    '로그인 상태에서 %s 접근 시 할일 목록으로 이동한다(WA-01)',
    async (path) => {
      const { router, queryClient } = renderApp(path);
      expect(await screen.findByRole('heading', { name: '할일 목록' })).toBeInTheDocument();
      expect(router.state.location.pathname).toBe('/todos');
      await waitFor(() => expect(queryClient.isFetching()).toBe(0));
    },
  );

  it('알 수 없는 경로는 할일 목록으로 보낸다', async () => {
    const { router, queryClient } = renderApp('/nope');
    await waitFor(() => expect(router.state.location.pathname).toBe('/todos'));
    await screen.findByText('홍길동님');
    await waitFor(() => expect(queryClient.isFetching()).toBe(0));
  });

  it('현재 사용자 조회가 401 외 오류면 공통 오류 문구를 보이고 이동하지 않는다', async () => {
    server.use(http.get(`${API}/users/me`, () => err(500, 'INTERNAL_ERROR', '내부 오류')));
    const { router } = renderApp('/profile');
    expect(await screen.findByRole('alert')).toHaveTextContent(MESSAGES.generic);
    expect(router.state.location.pathname).toBe('/profile');
  });

  it('ProfilePage는 사용자 정보가 없으면 아무것도 그리지 않는다', async () => {
    db.isLoggedIn = false;
    const { container, queryClient } = renderWithProviders(<ProfilePage />);
    await waitFor(() => expect(queryClient.getQueryData(['me'])).toBeNull());
    expect(container).toBeEmptyDOMElement();
  });
});
