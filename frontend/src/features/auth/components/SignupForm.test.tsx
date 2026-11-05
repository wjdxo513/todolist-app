import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { MESSAGES } from '../../../lib/messages';
import { API, db, err } from '../../../test/handlers';
import { renderApp } from '../../../test/renderWithProviders';
import { server } from '../../../test/server';

const signupRequests = () => db.requests.filter((r) => r.path === '/auth/signup');

async function fill(
  user: ReturnType<typeof renderApp>['user'],
  { email = 'new@example.com', password = 'password123', name = '김철수' } = {},
) {
  await screen.findByRole('heading', { name: '회원가입' });
  if (email) await user.type(screen.getByLabelText('이메일'), email);
  if (password) await user.type(screen.getByLabelText('비밀번호'), password);
  if (name) await user.type(screen.getByLabelText('이름'), name);
  await user.click(screen.getByRole('button', { name: '가입' }));
}

describe('SignupForm (SC-01, FE-06)', () => {
  beforeEach(() => {
    db.isLoggedIn = false;
  });

  it('이메일 형식 오류·비밀번호 7자·이름 빈 값은 요청 없이 해당 필드 아래 오류를 표시한다', async () => {
    const { user } = renderApp('/signup');
    await fill(user, { email: 'not-an-email', password: '1234567', name: '' });
    expect(screen.getByLabelText('이메일')).toHaveAccessibleDescription(
      '[!] 이메일 형식이 올바르지 않습니다.',
    );
    expect(screen.getByLabelText('비밀번호')).toHaveAccessibleDescription(
      '[!] 비밀번호는 8자 이상이어야 합니다.',
    );
    expect(screen.getByLabelText('이름')).toHaveAccessibleDescription('[!] 이름을 입력해 주세요.');
    expect(signupRequests()).toHaveLength(0);
  });

  it('이름 51자는 요청 없이 이름 필드 아래 오류를 표시한다', async () => {
    const { user } = renderApp('/signup');
    await fill(user, { name: '가'.repeat(51) });
    expect(screen.getByLabelText('이름')).toHaveAccessibleDescription(
      '[!] 이름은 1~50자로 입력해 주세요.',
    );
    expect(screen.getByLabelText('이메일')).not.toHaveAccessibleDescription();
    expect(signupRequests()).toHaveLength(0);
  });

  it('서버 409(이메일 중복)는 이메일 필드 아래에 표시되고 입력값이 유지된다', async () => {
    const { user, router } = renderApp('/signup');
    await fill(user, { email: 'hong@example.com' });
    await waitFor(() =>
      expect(screen.getByLabelText('이메일')).toHaveAccessibleDescription(
        '[!] 이미 가입된 이메일입니다.',
      ),
    );
    expect(signupRequests()).toHaveLength(1);
    expect(screen.getByLabelText('이메일')).toHaveValue('hong@example.com');
    expect(screen.getByLabelText('비밀번호')).toHaveValue('password123');
    expect(screen.getByLabelText('이름')).toHaveValue('김철수');
    expect(router.state.location.pathname).toBe('/signup');
  });

  it('서버 400 fields는 같은 필드 아래에 표시되고 입력값이 유지된다', async () => {
    server.use(
      http.post(`${API}/auth/signup`, () =>
        err(400, 'VALIDATION_ERROR', '입력값을 확인해 주세요.', { name: '서버가 거부한 이름' }),
      ),
    );
    const { user } = renderApp('/signup');
    await fill(user);
    await waitFor(() =>
      expect(screen.getByLabelText('이름')).toHaveAccessibleDescription('[!] 서버가 거부한 이름'),
    );
    expect(screen.getByLabelText('이름')).toHaveValue('김철수');
    expect(screen.getByLabelText('이메일')).toHaveValue('new@example.com');
  });

  it('가입 성공 시 로그인 화면으로 이동하고 가입 완료 안내가 보인다', async () => {
    const { user, router } = renderApp('/signup');
    await fill(user);
    expect(await screen.findByText(`(i) ${MESSAGES.signedUp}`)).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(signupRequests()[0].body).toEqual({
      email: 'new@example.com',
      password: 'password123',
      name: '김철수',
    });
  });

  it('로그인 화면 직접 접근 시에는 가입 완료 안내가 보이지 않는다', async () => {
    renderApp('/login');
    await screen.findByRole('heading', { name: '로그인' });
    expect(screen.queryByText(MESSAGES.signedUp, { exact: false })).not.toBeInTheDocument();
  });

  it('서버 오류(500)는 폼 상단 오류 영역에 표시된다', async () => {
    server.use(
      http.post(`${API}/auth/signup`, () =>
        err(500, 'INTERNAL_ERROR', '일시적인 오류가 발생했습니다.'),
      ),
    );
    const { user } = renderApp('/signup');
    await fill(user);
    expect(await screen.findByRole('alert')).toHaveTextContent('일시적인 오류가 발생했습니다.');
  });

  it('응답 본문을 해석하지 못하면 폼 상단에 공통 문구를 표시한다', async () => {
    server.use(
      http.post(`${API}/auth/signup`, () => new HttpResponse('not json', { status: 201 })),
    );
    const { user } = renderApp('/signup');
    await fill(user);
    expect(await screen.findByRole('alert')).toHaveTextContent(MESSAGES.generic);
  });

  it('네트워크 실패는 폼 상단 오류 영역에 표시된다', async () => {
    server.use(http.post(`${API}/auth/signup`, () => HttpResponse.error()));
    const { user, router } = renderApp('/signup');
    await fill(user);
    expect(await screen.findByRole('alert')).toHaveTextContent(MESSAGES.network);
    expect(router.state.location.pathname).toBe('/signup');
  });
});
