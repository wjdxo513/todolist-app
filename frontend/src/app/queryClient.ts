// QueryClient와 401 전역 처리(LP-09, LP-10). api/client.ts의 갱신·재시도까지 실패한 401만 여기 도달한다.
import { MutationCache, QueryCache, QueryClient, type Query } from '@tanstack/react-query';
import { isApiError } from '../api/client';
import { queryKeys } from '../lib/queryKeys';
import { useSessionStore } from '../stores/sessionStore';

interface Options {
  /** 로그인 화면으로 이동(라우터 navigate) */
  onUnauthenticated: () => void;
  retryDelay?: number;
}

/** 4xx는 재시도하지 않고 네트워크(0)·5xx만 재시도(LP-10) */
export const isRetryable = (error: unknown) =>
  !isApiError(error) || error.status === 0 || error.status >= 500;

export function createQueryClient({ onUnauthenticated, retryDelay }: Options): QueryClient {
  const handleError = (error: unknown, query?: Pick<Query, 'queryKey'>) => {
    if (!isApiError(error) || error.status !== 401 || error.code !== 'UNAUTHENTICATED') return;
    const wasAuthenticated = client.getQueryData(queryKeys.me) != null;
    if (wasAuthenticated) {
      // 이미 인증된 상태에서 갱신까지 실패: 안내 플래그 + 이전 사용자 데이터 제거(WA-21, E2E-02)
      useSessionStore.getState().setExpired(true);
      client.clear();
      client.setQueryData(queryKeys.me, null);
      onUnauthenticated();
    } else if (query?.queryKey[0] !== queryKeys.me[0]) {
      onUnauthenticated(); // 앱 진입 시 me의 401은 가드(RequireAuth)가 안내 없이 이동시킨다
    }
  };

  const client: QueryClient = new QueryClient({
    queryCache: new QueryCache({ onError: (error, query) => handleError(error, query) }),
    mutationCache: new MutationCache({ onError: (error) => handleError(error) }),
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => failureCount < 2 && isRetryable(error),
        ...(retryDelay === undefined ? {} : { retryDelay }),
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
  });
  return client;
}
