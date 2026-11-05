import styles from './Banner.module.css';

/** 안내 문구 '(i)'. 메시지가 있을 때만 표시 */
export function Notice({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="status" className={`${styles.banner} ${styles.notice}`}>
      (i) {message}
    </p>
  );
}
