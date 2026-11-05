import { Navigate, Outlet } from 'react-router';
import { useMe } from '../features/auth';
import { ROUTES } from '../lib/routes';

/** 로그인 상태에서 SC-01·02에 오면 SC-05로(WA-01) */
export function PublicOnly() {
  const me = useMe();
  if (me.isPending) return <p role="status">불러오는 중…</p>;
  if (me.data) return <Navigate to={ROUTES.todos} replace />;
  return <Outlet />;
}
