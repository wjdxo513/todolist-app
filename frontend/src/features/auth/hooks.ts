import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { logIn, logOut, signUp } from '../../api/auth';
import { isApiError } from '../../api/client';
import type { User } from '../../api/types';
import { getMe } from '../../api/users';
import { queryKeys } from '../../lib/queryKeys';
import { ROUTES } from '../../lib/routes';
import { useSessionStore } from '../../stores/sessionStore';

/**
 * 현재 사용자. null이면 로그아웃 상태. 401(갱신까지 실패)은 오류가 아니라 null로 둔다(가드가 이동, LP-09).
 * staleTime 무한: 로그인·로그아웃·이름 저장 때 캐시를 직접 갱신한다.
 */
export function useMe() {
  return useQuery<User | null>({
    queryKey: queryKeys.me,
    queryFn: async () => {
      try {
        return await getMe();
      } catch (e) {
        if (isApiError(e) && e.status === 401) return null;
        throw e;
      }
    },
    staleTime: Infinity,
  });
}

export function useSignup() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: signUp,
    // 자동 로그인 없이 로그인 화면으로, 안내는 이동 상태로 전달(SA-01, WA-02)
    onSuccess: () => navigate(ROUTES.login, { state: { signedUp: true } }),
  });
}

export function useLogin() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: logIn,
    onSuccess: (user) => {
      useSessionStore.getState().setExpired(false);
      qc.setQueryData(queryKeys.me, user);
      navigate(ROUTES.todos, { replace: true }); // SA-02, SA-04
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: logOut,
    onSuccess: () => {
      // 이전 사용자 데이터 제거(E2E-02). me를 null로 두어 로그인 화면이 갱신 요청을 하지 않게 한다(AD-13)
      qc.clear();
      qc.setQueryData(queryKeys.me, null);
      navigate(ROUTES.login, { replace: true });
    },
  });
}
