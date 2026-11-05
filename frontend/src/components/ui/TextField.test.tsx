import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TextField } from './TextField';

describe('TextField (5.4)', () => {
  it('error가 있으면 입력 바로 아래에 [!] 문구를 표시한다', () => {
    render(<TextField label="이메일" type="email" value="" error="이메일 형식이 아닙니다." />);
    const input = screen.getByLabelText('이메일');
    const msg = screen.getByText('[!] 이메일 형식이 아닙니다.');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('[!] 이메일 형식이 아닙니다.');
    expect(input.nextElementSibling).toBe(msg);
  });

  it('error가 없으면 오류 문구가 없다', () => {
    render(<TextField label="이름" value="홍" />);
    expect(screen.getByLabelText('이름')).not.toHaveAttribute('aria-invalid');
    expect(screen.queryByText(/\[!\]/)).not.toBeInTheDocument();
  });

  it('비밀번호 유형은 마스킹한다', () => {
    render(
      <TextField
        label="비밀번호"
        type="password"
        value="secret12"
        autoComplete="current-password"
      />,
    );
    expect(screen.getByLabelText('비밀번호')).toHaveAttribute('type', 'password');
  });

  it('입력하면 onChange로 값을 넘기고 required 표시를 한다', async () => {
    const onChange = vi.fn();
    render(<TextField label="제목" value="" onChange={onChange} required name="title" />);
    await userEvent.type(screen.getByRole('textbox', { name: /제목/ }), 'a');
    expect(onChange).toHaveBeenCalledWith('a');
    expect(screen.getByRole('textbox')).toBeRequired();
  });

  it('여러 줄 입력·힌트·글자 수 카운터(WA-22)', async () => {
    const onChange = vi.fn();
    render(
      <TextField
        label="메모"
        value="abc"
        onChange={onChange}
        multiline
        counterMax={1000}
        hint="선택"
      />,
    );
    const area = screen.getByLabelText('메모');
    expect(area.tagName).toBe('TEXTAREA');
    expect(screen.getByText('3 / 1000')).toBeInTheDocument();
    expect(screen.getByText('선택')).toBeInTheDocument();
    await userEvent.type(area, 'd');
    expect(onChange).toHaveBeenCalledWith('abcd');
  });

  it('onChange 없이 읽기 전용으로 쓸 수 있다', async () => {
    render(<TextField label="이메일" value="a@b.c" readOnly />);
    const input = screen.getByLabelText('이메일');
    expect(input).toHaveAttribute('readonly');
    await userEvent.type(input, 'x');
    expect(input).toHaveValue('a@b.c');
  });

  it('읽기 전용 여러 줄 입력도 onChange 없이 동작한다', async () => {
    render(<TextField label="메모" value="m" multiline />);
    await userEvent.type(screen.getByLabelText('메모'), 'x');
    expect(screen.getByLabelText('메모')).toHaveValue('m');
  });
});
