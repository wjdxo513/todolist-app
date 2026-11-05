import { Navigate, Outlet } from 'react-router';
import { ErrorBanner } from '../components/ui/ErrorBanner';
import { useMe } from '../features/auth';
import { MESSAGES } from '../lib/messages';
import { ROUTES } from '../lib/routes';

/** 미인증이면 SC-02로, 안내 없이(SN-03, LP-09) */
export function RequireAuth() {
  const me = useMe();
  if (me.isPending) return <p role="status">불러오는 중…</p>;
  if (me.isError) return <ErrorBanner message={MESSAGES.generic} />;
  if (!me.data) return <Navigate to={ROUTES.login} replace />;
  return <Outlet />;
}
