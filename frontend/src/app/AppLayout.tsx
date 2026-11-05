import { Outlet, useLocation } from 'react-router';
import { AppHeader } from '../components/layout/AppHeader';
import { useLogout, useMe } from '../features/auth';
import { MESSAGES } from '../lib/messages';
import { ROUTES } from '../lib/routes';
import styles from './AppLayout.module.css';

/** 공통 헤더 + 본문. 캘린더는 넓은 본문 폭(스타일 가이드 3.4) */
export function AppLayout() {
  const me = useMe();
  const logout = useLogout();
  const { pathname } = useLocation();
  const isWide = pathname.startsWith(ROUTES.calendar);
  return (
    <>
      <AppHeader
        userName={me.data?.name}
        onLogout={() => logout.mutate()}
        isLoggingOut={logout.isPending}
        logoutError={logout.isError ? MESSAGES.logoutFailed : null}
      />
      <main className={styles.main} data-wide={isWide || undefined}>
        <Outlet />
      </main>
    </>
  );
}
