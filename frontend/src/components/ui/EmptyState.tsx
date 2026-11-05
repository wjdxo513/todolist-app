import type { ReactNode } from 'react';
import styles from './Panel.module.css';

/** 빈 상태 문구 + 부가 액션 슬롯(4번 문서 5.6) */
export function EmptyState({ message, children }: { message: string; children?: ReactNode }) {
  return (
    <div className={styles.panel}>
      <p className={styles.muted}>{message}</p>
      {children}
    </div>
  );
}
