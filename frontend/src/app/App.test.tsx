import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { db, makeTodo } from '../test/handlers';
import { renderApp } from '../test/renderWithProviders';

describe('앱 조립 스모크', () => {
  it('로그인 상태로 / 에 오면 할일 목록과 헤더가 보인다', async () => {
    makeTodo({ title: '기획안', startDate: '2026-10-28', endDate: '2026-11-03' });
    renderApp('/');
    expect(await screen.findByRole('heading', { name: '할일 목록' })).toBeInTheDocument();
    expect(await screen.findByText('기획안')).toBeInTheDocument();
    expect(screen.getByText('홍길동님')).toBeInTheDocument();
  });

  it('TZ가 UTC가 아니다(TP-06)', () => {
    expect(process.env.TZ).not.toBe('UTC');
    expect(new Date(2026, 10, 4).getTimezoneOffset()).not.toBe(0);
    expect(db.isLoggedIn).toBe(true);
  });
});
