// FE-01 테스트 기반 점검(TP-05, TP-06, TP-07)
import { useQuery, type QueryClient } from '@tanstack/react-query';
import { screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getMe } from '../api/users';
import { queryKeys } from '../lib/queryKeys';
import { useTodoFilterStore } from '../stores/todoFilterStore';
import { db } from './handlers';
import { renderWithProviders } from './renderWithProviders';

const root = path.resolve(import.meta.dirname, '../..');
const readJson = (f: string) => JSON.parse(readFileSync(path.join(root, f), 'utf8'));

describe('프로젝트 설정', () => {
  it('tsconfig가 strict이고 필요한 npm 스크립트가 있다', () => {
    expect(readJson('tsconfig.json').compilerOptions.strict).toBe(true);
    expect(Object.keys(readJson('package.json').scripts)).toEqual(
      expect.arrayContaining(['dev', 'test', 'test:coverage', 'lint', 'format']),
    );
  });

  it('테스트 중 TZ가 UTC가 아니다(TP-06)', () => {
    expect(process.env.TZ).toBeTruthy();
    expect(process.env.TZ).not.toMatch(/^(UTC|Etc\/UTC|GMT)$/);
    expect(new Date(2026, 10, 4).getTimezoneOffset()).not.toBe(0);
  });
});

function Sample() {
  const { data } = useQuery({ queryKey: queryKeys.me, queryFn: getMe });
  return <p>{data ? `${data.name}님` : '불러오는 중'}</p>;
}

describe('renderWithProviders + MSW (TP-05)', () => {
  let first: QueryClient | undefined;

  it('샘플 컴포넌트가 MSW 핸들러 응답을 받아 표시한다', async () => {
    const { queryClient } = renderWithProviders(<Sample />);
    expect(await screen.findByText('홍길동님')).toBeInTheDocument();
    expect(db.requests.map((r) => r.path)).toEqual(['/users/me']);
    useTodoFilterStore.getState().setCategory(2);
    db.isLoggedIn = false;
    first = queryClient;
  });

  it('다음 테스트에서는 QueryClient·스토어·가짜 DB가 새로 시작한다', () => {
    const { queryClient } = renderWithProviders(<Sample />);
    expect(first).toBeDefined();
    expect(queryClient).not.toBe(first);
    expect(first?.getQueryData(queryKeys.me)).toBeUndefined(); // 이전 테스트의 캐시는 정리됨
    expect(queryClient.getQueryData(queryKeys.me)).toBeUndefined();
    expect(useTodoFilterStore.getState()).toMatchObject({ categoryId: null, page: 1 });
    expect(db.isLoggedIn).toBe(true);
  });
});
