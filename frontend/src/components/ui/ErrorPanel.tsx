import { Button } from './Button';
import styles from './Panel.module.css';

/** 화면 전체를 그릴 수 없을 때의 대체 화면. 새로고침으로 복구를 시도한다 */
export function ErrorPanel() {
  return (
    <div className={styles.panel} role="alert">
      <h1 className={styles.title}>(!) 화면을 표시하지 못했습니다.</h1>
      <p className={styles.muted}>일시적인 문제일 수 있습니다. 새로고침해 주세요.</p>
      <Button variant="primary" onClick={() => window.location.reload()}>
        새로고침
      </Button>
    </div>
  );
}
