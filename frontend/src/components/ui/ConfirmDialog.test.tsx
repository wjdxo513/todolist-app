import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from './ConfirmDialog';

const setup = (props: Partial<Parameters<typeof ConfirmDialog>[0]> = {}) => {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  const view = render(
    <ConfirmDialog
      open
      title="할일 삭제"
      message="'기획안'을 삭제할까요?"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...props}
    />,
  );
  return { onConfirm, onCancel, ...view };
};

describe('ConfirmDialog (5.1, BR-11)', () => {
  it('제목·본문을 props로 표시하고 취소에 먼저 초점을 둔다', () => {
    setup();
    expect(screen.getByRole('dialog', { name: '할일 삭제' })).toBeInTheDocument();
    expect(screen.getByText("'기획안'을 삭제할까요?")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '취소' })).toHaveFocus();
  });

  it('확인 시 onConfirm만 호출한다', async () => {
    const { onConfirm, onCancel } = setup();
    await userEvent.click(screen.getByRole('button', { name: '삭제' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('취소·Esc 시 onCancel만 호출한다', async () => {
    const { onConfirm, onCancel } = setup();
    await userEvent.click(screen.getByRole('button', { name: '취소' }));
    await userEvent.keyboard('{Escape}');
    await userEvent.keyboard('a');
    expect(onCancel).toHaveBeenCalledTimes(2);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('카테고리 변형: 확인 라벨 변경, 처리 중이면 확인 비활성', () => {
    setup({ title: '카테고리 삭제', confirmLabel: '삭제하기', isPending: true });
    expect(screen.getByRole('dialog', { name: '카테고리 삭제' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '삭제하기' })).toBeDisabled();
  });

  it('닫혀 있으면 렌더하지 않고 Esc도 무시한다', async () => {
    const { onCancel } = setup({ open: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(onCancel).not.toHaveBeenCalled();
  });
});
