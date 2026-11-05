import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DateField } from './DateField';

function Controlled({
  initial = '',
  onChange,
}: {
  initial?: string;
  onChange: (v: string) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <DateField
      label="종료일"
      value={value}
      required
      onChange={(v) => {
        setValue(v);
        onChange(v);
      }}
    />
  );
}

describe('DateField (D-03, CP-03, TP-06)', () => {
  it('네이티브 date 입력이고 선택 값이 YYYY-MM-DD 문자열 그대로 onChange로 간다', () => {
    expect(new Date(2026, 10, 5).getTimezoneOffset()).not.toBe(0);
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    const input = screen.getByLabelText(/종료일/);
    expect(input).toHaveAttribute('type', 'date');
    fireEvent.change(input, { target: { value: '2026-11-05' } });
    expect(onChange).toHaveBeenLastCalledWith('2026-11-05');
    expect(input).toHaveValue('2026-11-05'); // 비UTC에서도 하루 밀리지 않는다
    fireEvent.change(input, { target: { value: '' } });
    expect(onChange).toHaveBeenLastCalledWith('');
  });

  it('키보드 직접 입력도 브라우저 기본 동작으로 받는다(D-03)', async () => {
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    await userEvent.type(screen.getByLabelText(/종료일/), '2027-01-01');
    expect(onChange).toHaveBeenLastCalledWith('2027-01-01');
    expect(onChange.mock.calls.every(([v]) => v === '' || /^\d{4}-\d{2}-\d{2}$/.test(v))).toBe(
      true,
    );
  });

  it('min·max가 없어 시작일보다 이른 날짜 선택을 막지 않는다(WA-13)', () => {
    const onChange = vi.fn();
    render(<Controlled initial="2026-11-10" onChange={onChange} />);
    const input = screen.getByLabelText(/종료일/);
    expect(input).not.toHaveAttribute('min');
    expect(input).not.toHaveAttribute('max');
    fireEvent.change(input, { target: { value: '2026-11-01' } });
    expect(onChange).toHaveBeenLastCalledWith('2026-11-01');
    expect(input).toBeValid();
  });

  it('error가 있으면 필드 아래에 표시하고 입력과 연결한다(5.4)', () => {
    const { rerender } = render(<DateField label="시작일" value="" onChange={() => {}} />);
    const input = screen.getByLabelText('시작일');
    expect(input).not.toHaveAttribute('aria-invalid');
    rerender(
      <DateField label="시작일" value="" onChange={() => {}} error="날짜를 입력해 주세요." />,
    );
    const msg = screen.getByText('[!] 날짜를 입력해 주세요.');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('[!] 날짜를 입력해 주세요.');
    expect(input.compareDocumentPosition(msg) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
