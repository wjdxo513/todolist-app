import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../../../lib/messages';
import { API, db, err } from '../../../test/handlers';
import { renderApp } from '../../../test/renderWithProviders';
import { server } from '../../../test/server';

const userRequests = () =>
  db.requests.filter((r) => r.method !== 'GET' && r.path.startsWith('/users/me'));

async function open() {
  const view = renderApp('/profile');
  await screen.findByRole('heading', { name: '내 정보' });
  const basic = screen.getByRole('form', { name: '기본 정보' });
  const password = screen.getByRole('form', { name: '비밀번호 변경' });
  return { ...view, basic, password };
}

describe('내 정보 (SC-03, FE-08)', () => {
  it('이메일은 읽기 전용이고 편집 수단이 없다', async () => {
    const { user, basic } = await open();
    const email = within(basic).getByLabelText('이메일');
    expect(email).toHaveValue('hong@example.com');
    expect(email).toHaveAttribute('readonly');
    await user.type(email, 'x');
    expect(email).toHaveValue('hong@example.com');
    expect(
      within(basic)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['이름 저장']);
  });

  it.each([
    ['빈 값', '', '이름을 입력해 주세요.'],
    ['51자', '가'.repeat(51), '이름은 1~50자로 입력해 주세요.'],
  ])('이름이 %s이면 요청 없이 필드 아래 오류를 표시한다', async (_, value, message) => {
    const { user, basic } = await open();
    const name = within(basic).getByLabelText('이름');
    await user.clear(name);
    if (value) await user.type(name, value);
    await user.click(within(basic).getByRole('button', { name: '이름 저장' }));
    expect(name).toHaveAccessibleDescription(`[!] ${message}`);
    expect(userRequests()).toHaveLength(0);
  });

  it('이름 저장 성공 시 안내가 표시되고 헤더 이름이 즉시 갱신되며 비밀번호 요청은 없다', async () => {
    const { user, basic } = await open();
    const name = within(basic).getByLabelText('이름');
    await user.clear(name);
    await user.type(name, '김영희');
    await user.click(within(basic).getByRole('button', { name: '이름 저장' }));
    expect(await within(basic).findByText('(i) 저장되었습니다.')).toBeInTheDocument();
    expect(screen.getByText('김영희님')).toBeInTheDocument();
    expect(userRequests()).toEqual([
      { method: 'PATCH', path: '/users/me', search: '', body: { name: '김영희' } },
    ]);
    // 다시 입력하면 저장 안내가 사라진다
    await user.type(name, '!');
    expect(within(basic).queryByText('(i) 저장되었습니다.')).not.toBeInTheDocument();
  });

  it('이름 저장 서버 거부는 fields면 필드 아래, 그 외는 영역 상단에 표시한다', async () => {
    server.use(
      http.patch(`${API}/users/me`, () =>
        err(400, 'VALIDATION_ERROR', '입력값을 확인해 주세요.', { name: '서버 이름 오류' }),
      ),
    );
    const { user, basic } = await open();
    const save = within(basic).getByRole('button', { name: '이름 저장' });
    await user.click(save);
    await waitFor(() =>
      expect(within(basic).getByLabelText('이름')).toHaveAccessibleDescription(
        '[!] 서버 이름 오류',
      ),
    );

    server.use(http.patch(`${API}/users/me`, () => HttpResponse.error()));
    await user.click(save);
    expect(await within(basic).findByRole('alert')).toHaveTextContent(MESSAGES.network);
  });

  it('새 비밀번호 7자는 요청 없이 필드 아래 오류를 표시한다', async () => {
    const { user, password } = await open();
    await user.type(within(password).getByLabelText('현재 비밀번호'), 'password123');
    await user.type(within(password).getByLabelText('새 비밀번호'), '1234567');
    await user.click(within(password).getByRole('button', { name: '비밀번호 변경' }));
    expect(within(password).getByLabelText('새 비밀번호')).toHaveAccessibleDescription(
      '[!] 비밀번호는 8자 이상이어야 합니다.',
    );
    expect(userRequests()).toHaveLength(0);
  });

  it('현재 비밀번호 불일치(400 fields)는 현재 비밀번호 아래에 표시되고 두 필드가 비워진다', async () => {
    const { user, password } = await open();
    await user.type(within(password).getByLabelText('현재 비밀번호'), 'wrong-pass');
    await user.type(within(password).getByLabelText('새 비밀번호'), 'newpassword1');
    await user.click(within(password).getByRole('button', { name: '비밀번호 변경' }));
    await waitFor(() =>
      expect(within(password).getByLabelText('현재 비밀번호')).toHaveAccessibleDescription(
        '[!] 현재 비밀번호가 일치하지 않습니다.',
      ),
    );
    expect(within(password).getByLabelText('현재 비밀번호')).toHaveValue('');
    expect(within(password).getByLabelText('새 비밀번호')).toHaveValue('');
  });

  it('불일치 응답이 401(INVALID_CREDENTIALS)이어도 로그인 화면으로 가지 않는다', async () => {
    server.use(
      http.put(`${API}/users/me/password`, () =>
        err(401, 'INVALID_CREDENTIALS', '현재 비밀번호가 일치하지 않습니다.'),
      ),
    );
    const { user, router, password } = await open();
    await user.type(within(password).getByLabelText('현재 비밀번호'), 'wrong-pass');
    await user.type(within(password).getByLabelText('새 비밀번호'), 'newpassword1');
    await user.click(within(password).getByRole('button', { name: '비밀번호 변경' }));
    await waitFor(() =>
      expect(within(password).getByLabelText('현재 비밀번호')).toHaveAccessibleDescription(
        '[!] 현재 비밀번호가 일치하지 않습니다.',
      ),
    );
    expect(within(password).getByLabelText('새 비밀번호')).toHaveValue('');
    expect(router.state.location.pathname).toBe('/profile');
    expect(db.requests.filter((r) => r.path === '/auth/refresh')).toHaveLength(0);
    expect(screen.getByText('홍길동님')).toBeInTheDocument();
  });

  it('비밀번호 변경 성공 시 입력란이 초기화되고 안내가 보이며 로그인 상태가 유지된다', async () => {
    const { user, router, password } = await open();
    await user.type(within(password).getByLabelText('현재 비밀번호'), 'password123');
    await user.type(within(password).getByLabelText('새 비밀번호'), 'newpassword1');
    await user.click(within(password).getByRole('button', { name: '비밀번호 변경' }));
    expect(await within(password).findByText('(i) 비밀번호가 변경되었습니다.')).toBeInTheDocument();
    expect(within(password).getByLabelText('현재 비밀번호')).toHaveValue('');
    expect(within(password).getByLabelText('새 비밀번호')).toHaveValue('');
    expect(router.state.location.pathname).toBe('/profile');
    expect(screen.getByText('홍길동님')).toBeInTheDocument();
    expect(db.isLoggedIn).toBe(true);
    // 이름 저장과 다른 별개 요청(WA-06)
    expect(userRequests()).toEqual([
      {
        method: 'PUT',
        path: '/users/me/password',
        search: '',
        body: { currentPassword: 'password123', newPassword: 'newpassword1' },
      },
    ]);
    // 다시 입력하면 안내가 사라진다
    await user.type(within(password).getByLabelText('현재 비밀번호'), 'a');
    expect(within(password).queryByText('(i) 비밀번호가 변경되었습니다.')).not.toBeInTheDocument();
  });

  it('비밀번호 변경의 그 외 실패는 영역 상단에 표시한다', async () => {
    server.use(
      http.put(`${API}/users/me/password`, () => err(500, 'INTERNAL_ERROR', '일시적 오류')),
    );
    const { user, password } = await open();
    await user.click(within(password).getByRole('button', { name: '비밀번호 변경' }));
    expect(within(password).getByLabelText('현재 비밀번호')).toHaveAccessibleDescription(
      '[!] 현재 비밀번호를 입력해 주세요.',
    );
    await user.type(within(password).getByLabelText('현재 비밀번호'), 'password123');
    await user.type(within(password).getByLabelText('새 비밀번호'), 'newpassword1');
    await user.click(within(password).getByRole('button', { name: '비밀번호 변경' }));
    expect(await within(password).findByRole('alert')).toHaveTextContent('일시적 오류');
  });
});
