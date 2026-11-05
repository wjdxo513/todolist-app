import { Button } from './Button';
import styles from './Panel.module.css';

/** '찾을 수 없음'(4번 문서 5.7). 타인 ID와 없는 ID를 구분하지 않는다 */
export function NotFoundPanel({ onBack }: { onBack: () => void }) {
  return (
    <div className={styles.panel}>
      <h1 className={styles.title}>(!) 할일을 찾을 수 없습니다.</h1>
      <p className={styles.muted}>요청하신 할일이 없거나 삭제되었습니다.</p>
      <Button variant="primary" onClick={onBack}>
        할일 목록으로
      </Button>
    </div>
  );
}
