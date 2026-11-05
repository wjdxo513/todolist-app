import { readFileSync } from 'node:fs';
import path from 'node:path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TODO_STATUSES } from '../../api/types';
import { StatusBadge, StatusBar } from './StatusBadge';

describe('StatusBadge (FR-10, WA-19)', () => {
  it('네 상태가 서로 다른 라벨·모양을 렌더한다', () => {
    const shapes = { '시작 전': '( )', 진행중: '(>)', 완료: '(v)', '기한 초과': '(!)' };
    const rendered = TODO_STATUSES.map((s) => {
      const { container, unmount } = render(<StatusBadge status={s} />);
      const text = container.textContent;
      expect(text).toBe(`${shapes[s]} ${s}`);
      unmount();
      return text;
    });
    expect(new Set(rendered).size).toBe(4);
  });
});

describe('StatusBar (WA-19)', () => {
  it('완료 변형은 제목에 취소선 표시(data-done)를 붙인다', () => {
    const css = readFileSync(path.join(import.meta.dirname, 'StatusBadge.module.css'), 'utf8');
    expect(css).toMatch(/\[data-done\][^}]*line-through/);
    render(
      <>
        <StatusBar status="완료" title="끝난 일" ariaLabel="끝난 일 완료" />
        <StatusBar status="진행중" title="하는 일" ariaLabel="하는 일 진행중" />
      </>,
    );
    expect(screen.getByText('끝난 일')).toHaveAttribute('data-done', 'true');
    expect(screen.getByText('하는 일')).not.toHaveAttribute('data-done');
  });

  it('상태마다 다른 모양 클래스, 이어짐 표시·보조 표기·클릭', async () => {
    const onClick = vi.fn();
    render(
      <StatusBar
        status="기한 초과"
        title="늦은 일"
        detail="11-01~11-03"
        continuesLeft
        continuesRight
        onClick={onClick}
        ariaLabel="늦은 일 기한 초과"
      />,
    );
    const bar = screen.getByRole('button', { name: '늦은 일 기한 초과' });
    expect(bar).toHaveClass('bar', 'overdue', 'contLeft', 'contRight');
    expect(bar).toHaveTextContent('<(!)늦은 일 11-01~11-03>');
    await userEvent.click(bar);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('제목이 없으면 모양만 그린다(모바일 월·주 뷰)', () => {
    render(<StatusBar status="시작 전" ariaLabel="할 일 시작 전" />);
    const bar = screen.getByRole('button', { name: '할 일 시작 전' });
    expect(bar).toHaveTextContent(/^\( \)$/);
    expect(bar).toHaveClass('todo');
    expect(bar).not.toHaveClass('contLeft');
  });
});
