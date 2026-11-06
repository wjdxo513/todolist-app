import { Navigate, Outlet } from 'react-router';
import { ErrorPanel } from '../components/ui/ErrorPanel';
import { useMe } from '../features/auth';
import { ROUTES } from '../lib/routes';

/** 미인증이면 SC-02로, 안내 없이(SN-03, LP-09) */
export function RequireAuth() {
  const me = useMe();
  if (me.isPending) return <p role="status">불러오는 중…</p>;
  if (me.isError) return <ErrorPanel />;
  if (!me.data) return <Navigate to={ROUTES.login} replace />;
  return <Outlet />;
}
