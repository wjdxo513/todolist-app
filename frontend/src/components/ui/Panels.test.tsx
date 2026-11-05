import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';
import { EmptyState } from './EmptyState';
import { ErrorBanner } from './ErrorBanner';
import { NotFoundPanel } from './NotFoundPanel';
import { Notice } from './Notice';

describe('ErrorBanner·Notice (5.4)', () => {
  it.each([undefined, null, ''])('메시지가 %s 이면 표시하지 않는다', (message) => {
    const { container } = render(
      <>
        <ErrorBanner message={message} />
        <Notice message={message} />
      </>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('메시지가 있을 때만 표시한다', () => {
    render(
      <>
        <ErrorBanner message="저장하지 못했습니다." />
        <Notice message="가입이 완료되었습니다." />
      </>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('[!] 저장하지 못했습니다.');
    expect(screen.getByRole('status')).toHaveTextContent('(i) 가입이 완료되었습니다.');
  });
});

describe('EmptyState·NotFoundPanel (5.6, 5.7)', () => {
  it('EmptyState는 문구와 부가 액션 슬롯을 표시한다', () => {
    render(
      <EmptyState message="할일이 없습니다.">
        <Button>할일 추가</Button>
      </EmptyState>,
    );
    expect(screen.getByText('할일이 없습니다.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '할일 추가' })).toBeInTheDocument();
  });

  it("NotFoundPanel은 문구와 '할일 목록으로' 버튼을 표시한다", async () => {
    const onBack = vi.fn();
    render(<NotFoundPanel onBack={onBack} />);
    expect(
      screen.getByRole('heading', { name: '(!) 할일을 찾을 수 없습니다.' }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '할일 목록으로' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe('Button', () => {
  it('기본은 type=button·보조 변형, 변형·크기·추가 클래스를 붙인다', () => {
    render(
      <>
        <Button>기본</Button>
        <Button type="submit" variant="danger" size="sm" className="extra">
          위험
        </Button>
      </>,
    );
    expect(screen.getByRole('button', { name: '기본' })).toHaveAttribute('type', 'button');
    expect(screen.getByRole('button', { name: '기본' })).toHaveClass('button', 'secondary');
    const danger = screen.getByRole('button', { name: '위험' });
    expect(danger).toHaveAttribute('type', 'submit');
    expect(danger).toHaveClass('button', 'danger', 'sm', 'extra');
  });
});
