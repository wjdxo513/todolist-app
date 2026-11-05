import { useState } from 'react';
import { NavLink } from 'react-router';
import { ROUTES } from '../../lib/routes';
import { Button } from '../ui/Button';
import { ErrorBanner } from '../ui/ErrorBanner';
import styles from './AppHeader.module.css';

const NAV = [
  { to: ROUTES.todos, label: '할일 목록' },
  { to: ROUTES.calendar, label: '캘린더' },
  { to: ROUTES.categories, label: '카테고리' },
  { to: ROUTES.profile, label: '내 정보' },
];

interface AppHeaderProps {
  userName?: string;
  onLogout: () => void;
  isLoggingOut?: boolean;
  logoutError?: string | null;
}

/** 공통 헤더(4번 문서 3장, WA-04, WA-05). SC-06(/todos/...)에서는 '할일 목록'이 강조된다 */
export function AppHeader({ userName, onLogout, isLoggingOut, logoutError }: AppHeaderProps) {
  const [isMenuOpen, setMenuOpen] = useState(false);
  return (
    <>
      <header className={styles.header}>
        <div className={styles.inner}>
          <button
            type="button"
            className={styles.menuButton}
            aria-expanded={isMenuOpen}
            aria-controls="app-nav"
            aria-label="메뉴"
            onClick={() => setMenuOpen((v) => !v)}
          >
            [=]
          </button>
          <span className={styles.brand}>TodoList</span>
          <nav
            id="app-nav"
            aria-label="주 메뉴"
            className={styles.nav}
            data-open={isMenuOpen || undefined}
          >
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [styles.link, isActive && styles.active].filter(Boolean).join(' ')
                }
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          {userName && <span className={styles.user}>{userName}님</span>}
          <Button size="sm" onClick={onLogout} disabled={isLoggingOut}>
            로그아웃
          </Button>
        </div>
      </header>
      {logoutError && (
        <div className={styles.errorArea}>
          <ErrorBanner message={logoutError} />
        </div>
      )}
    </>
  );
}
