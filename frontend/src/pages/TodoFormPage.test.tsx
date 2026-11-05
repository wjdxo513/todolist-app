import { screen } from '@testing-library/react';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';
import { API, db, err } from '../test/handlers';
import { renderApp } from '../test/renderWithProviders';
import { server } from '../test/server';

describe('TodoFormPage 편집 진입(SN-13, 5.7)', () => {
  it("없는 할일(404)이면 헤더를 유지한 채 '할일을 찾을 수 없습니다.'를 표시하고 목록으로 돌아갈 수 있다", async () => {
    const { user, router } = renderApp('/todos/999/edit');
    expect(
      await screen.findByRole('heading', { name: '(!) 할일을 찾을 수 없습니다.' }),
    ).toBeInTheDocument();
    expect(screen.getByText('홍길동님')).toBeInTheDocument(); // 헤더 유지
    expect(db.requests.some((r) => r.path === '/todos/999')).toBe(true);
    await user.click(screen.getByRole('button', { name: '할일 목록으로' }));
    expect(router.state.location.pathname).toBe('/todos');
  });

  it.each(['abc', '0', '01', '12345678901'])(
    '잘못된 ID(%s)는 요청 없이 찾을 수 없음',
    async (id) => {
      renderApp(`/todos/${id}/edit`);
      expect(
        await screen.findByRole('heading', { name: '(!) 할일을 찾을 수 없습니다.' }),
      ).toBeInTheDocument();
      expect(db.requests.filter((r) => r.path.startsWith('/todos/'))).toEqual([]);
    },
  );

  it('404가 아닌 조회 실패는 공통 오류 문구를 표시한다', async () => {
    server.use(http.get(`${API}/todos/:id`, () => err(403, 'FORBIDDEN', '금지')));
    renderApp('/todos/5/edit');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      '처리하지 못했습니다. 다시 시도해 주세요.',
    );
  });
});
