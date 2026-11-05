import { useMutation, useQueryClient } from '@tanstack/react-query';
import { changePassword, updateMe } from '../../api/users';
import { queryKeys } from '../../lib/queryKeys';

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateMe,
    onSuccess: (user) => qc.setQueryData(queryKeys.me, user), // 헤더 이름 즉시 갱신(WA-04)
  });
}

export function useChangePassword() {
  return useMutation({ mutationFn: changePassword });
}
