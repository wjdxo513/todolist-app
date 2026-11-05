import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router';
import { createQueryClient } from '../app/queryClient';
import { routes } from '../app/router';

interface Options {
  /** 시작 경로 */
  path?: string;
  /** 없으면 앱 전체 라우트(가드·레이아웃 포함) */
  routes?: RouteObject[];
}

/** 테스트가 만든 QueryClient. setup.ts가 테스트 끝에 요청이 다 끝나길 기다린 뒤 비운다 */
export const activeClients = new Set<QueryClient>();

/** QueryClient 새 인스턴스 + 메모리 라우터로 렌더한다(TP-05). 스토어는 setup.ts가 초기화 */
export function renderWithProviders(ui: ReactElement | null, options: Options = {}) {
  const router = createMemoryRouter(
    options.routes ?? (ui ? [{ path: '*', element: ui }] : routes),
    { initialEntries: [options.path ?? '/'] },
  );
  const queryClient: QueryClient = createQueryClient({
    onUnauthenticated: () => void router.navigate('/login', { replace: true }),
    retryDelay: 0,
  });
  activeClients.add(queryClient);
  const user = userEvent.setup();
  const view = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { ...view, user, router, queryClient };
}

/** 앱 전체를 path에서 시작 */
export const renderApp = (path: string) => renderWithProviders(null, { path });
