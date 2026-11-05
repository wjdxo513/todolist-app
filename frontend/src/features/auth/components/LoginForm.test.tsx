import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { MESSAGES } from '../../../lib/messages';
import { useSessionStore } from '../../../stores/sessionStore';
import { API, db, err } from '../../../test/handlers';
import { renderApp } from '../../../test/renderWithProviders';
import { server } from '../../../test/server';

const loginRequests = () => db.requests.filter((r) => r.path === '/auth/login');

async function submit(
  user: ReturnType<typeof renderApp>['user'],
  email = 'hong@example.com',
  password = 'password123',
) {
  await screen.findByRole('heading', { name: '로그인' });
  if (email) await user.type(screen.getByLabelText('이메일'), email);
  if (password) await user.type(screen.getByLabelText('비밀번호'), password);
  await user.click(screen.getByRole('button', { name: '로그인' }));
}

describe('LoginForm (SC-02, FE-06)', () => {
  beforeEach(() => {
    db.isLoggedIn = false;
  });

  it('로그인 성공 시 할일 목록 경로로 이동한다', async () => {
    const { user, router, queryClient } = renderApp('/login');
    await submit(user);
    await waitFor(() => expect(router.state.location.pathname).toBe('/todos'));
    expect(await screen.findByText('홍길동님')).toBeInTheDocument();
    await waitFor(() => expect(queryClient.isFetching()).toBe(0));
  });

  it('빈 값은 요청 없이 필드 아래 오류를 표시한다', async () => {
    const { user } = renderApp('/login');
    await submit(user, '', '');
    expect(screen.getByLabelText('이메일')).toHaveAccessibleDescription(
      '[!] 이메일을 입력해 주세요.',
    );
    expect(screen.getByLabelText('비밀번호')).toHaveAccessibleDescription(
      '[!] 비밀번호를 입력해 주세요.',
    );
    expect(loginRequests()).toHaveLength(0);
  });

  it('401 INVALID_CREDENTIALS는 폼 상단 단일 문구로 표시되고 비밀번호가 비워지며 로그인 화면에 남는다', async () => {
    const { user, router } = renderApp('/login');
    await submit(user, 'hong@example.com', 'wrong-password');
    expect(await screen.findByRole('alert')).toHaveTextContent(MESSAGES.invalidCredentials);
    expect(screen.getByLabelText('비밀번호')).toHaveValue('');
    expect(screen.getByLabelText('이메일')).toHaveValue('hong@example.com');
    expect(screen.getByLabelText('이메일')).not.toHaveAccessibleDescription();
    expect(router.state.location.pathname).toBe('/login');
    // 로그인 실패 401은 갱신 대상이 아니다(LP-09)
    expect(db.requests.filter((r) => r.path === '/auth/refresh')).toHaveLength(1); // 진입 시 me 확인 1회뿐
  });

  it('429 응답은 차단 안내 문구로 표시된다', async () => {
    server.use(
      http.post(`${API}/auth/login`, () =>
        err(429, 'TOO_MANY_ATTEMPTS', '로그인 시도가 너무 많습니다.'),
      ),
    );
    const { user } = renderApp('/login');
    await submit(user);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      '로그인 시도가 5회 실패했습니다. 5분 후 다시 시도해 주세요.',
    );
    expect(screen.getByLabelText('비밀번호')).toHaveValue('');
  });

  it('세션 만료 플래그가 켜져 있으면 만료 안내가 보이고, 로그인 성공 시 플래그가 꺼진다', async () => {
    useSessionStore.setState({ isExpired: true });
    const { user, router, queryClient } = renderApp('/login');
    expect(await screen.findByText(`(i) ${MESSAGES.sessionExpired}`)).toBeInTheDocument();
    await submit(user);
    await waitFor(() => expect(router.state.location.pathname).toBe('/todos'));
    expect(useSessionStore.getState().isExpired).toBe(false);
    // 진행 중 요청이 다음 테스트의 가짜 DB 상태로 끝나지 않게 기다린다
    await screen.findByText('홍길동님');
    await waitFor(() => expect(queryClient.isFetching()).toBe(0));
  });

  it('세션 만료 플래그가 꺼져 있으면 만료 안내가 보이지 않는다', async () => {
    renderApp('/login');
    await screen.findByRole('heading', { name: '로그인' });
    expect(screen.queryByText(MESSAGES.sessionExpired, { exact: false })).not.toBeInTheDocument();
  });

  it('서버 오류(500)는 폼 상단 오류 영역에 공통 문구로 표시된다', async () => {
    server.use(http.post(`${API}/auth/login`, () => err(500, 'INTERNAL_ERROR', '내부 오류')));
    const { user } = renderApp('/login');
    await submit(user);
    expect(await screen.findByRole('alert')).toHaveTextContent(MESSAGES.generic);
  });

  it('응답 본문을 해석하지 못하면 폼 상단에 공통 문구를 표시한다', async () => {
    server.use(http.post(`${API}/auth/login`, () => new HttpResponse('not json', { status: 200 })));
    const { user } = renderApp('/login');
    await submit(user);
    expect(await screen.findByRole('alert')).toHaveTextContent(MESSAGES.generic);
  });

  it('네트워크 실패는 폼 상단 오류 영역에 표시된다', async () => {
    server.use(http.post(`${API}/auth/login`, () => HttpResponse.error()));
    const { user, router } = renderApp('/login');
    await submit(user);
    expect(await screen.findByRole('alert')).toHaveTextContent(MESSAGES.network);
    expect(router.state.location.pathname).toBe('/login');
  });

  it('서버 400 fields는 같은 필드 아래에 표시된다', async () => {
    server.use(
      http.post(`${API}/auth/login`, () =>
        err(400, 'VALIDATION_ERROR', '입력값을 확인해 주세요.', { email: '이메일 형식 오류' }),
      ),
    );
    const { user } = renderApp('/login');
    await submit(user);
    await waitFor(() =>
      expect(screen.getByLabelText('이메일')).toHaveAccessibleDescription('[!] 이메일 형식 오류'),
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
