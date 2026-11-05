import styles from './Banner.module.css';

/** 영역 오류(4번 문서 5.4). 메시지가 있을 때만 표시 */
export function ErrorBanner({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className={`${styles.banner} ${styles.error}`}>
      [!] {message}
    </p>
  );
}
