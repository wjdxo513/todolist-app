import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Pagination } from './Pagination';

describe('Pagination (5.5)', () => {
  it.each([0, 1])('전체 %i페이지면 렌더하지 않는다', (totalPages) => {
    const { container } = render(
      <Pagination page={1} totalPages={totalPages} onChange={() => {}} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('현재 페이지를 강조하고 모바일용 현재 / 전체를 제공한다', () => {
    render(<Pagination page={2} totalPages={3} onChange={() => {}} />);
    const current = screen.getByRole('button', { name: '2페이지' });
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current).toHaveClass('primary');
    expect(screen.getByRole('button', { name: '1페이지' })).not.toHaveAttribute('aria-current');
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('첫 페이지에서 이전, 마지막 페이지에서 다음을 비활성화한다', () => {
    const { rerender } = render(<Pagination page={1} totalPages={3} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: /이전/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /다음/ })).toBeEnabled();
    rerender(<Pagination page={3} totalPages={3} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: /이전/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /다음/ })).toBeDisabled();
  });

  it('이전·다음·번호 클릭으로 onChange를 호출한다', async () => {
    const onChange = vi.fn();
    render(<Pagination page={2} totalPages={3} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: /이전/ }));
    await userEvent.click(screen.getByRole('button', { name: /다음/ }));
    await userEvent.click(screen.getByRole('button', { name: '3페이지' }));
    expect(onChange.mock.calls).toEqual([[1], [3], [3]]);
  });
});
