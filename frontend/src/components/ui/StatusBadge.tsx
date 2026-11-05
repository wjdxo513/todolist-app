// 상태 표시(4번 문서 5.2, WA-19): 라벨 + 모양 + 막대 선 모양. 색은 보조 수단.
// 상태는 서버가 준 값을 표시만 한다(LP-13).
import type { TodoStatus } from '../../api/types';
import styles from './StatusBadge.module.css';

export const STATUS_META: Record<TodoStatus, { shape: string; tone: string }> = {
  '시작 전': { shape: '( )', tone: 'todo' },
  진행중: { shape: '(>)', tone: 'progress' },
  완료: { shape: '(v)', tone: 'done' },
  '기한 초과': { shape: '(!)', tone: 'overdue' },
};

export function StatusBadge({ status }: { status: TodoStatus }) {
  const { shape, tone } = STATUS_META[status];
  return (
    <span className={`${styles.badge} ${styles[tone]}`}>
      <span aria-hidden="true">{shape}</span> {status}
    </span>
  );
}

interface StatusBarProps {
  status: TodoStatus;
  /** 없으면 모양+선만(모바일 월·주 뷰) */
  title?: string;
  /** 제목 뒤에 붙는 보조 표기(주 뷰의 라벨·기간) */
  detail?: string;
  continuesLeft?: boolean;
  continuesRight?: boolean;
  onClick?: () => void;
  ariaLabel: string;
}

/** 캘린더 블록형 막대(스타일 가이드 2장). 완료는 물결 밑줄 + 제목 취소선 */
export function StatusBar({
  status,
  title,
  detail,
  continuesLeft,
  continuesRight,
  onClick,
  ariaLabel,
}: StatusBarProps) {
  const { shape, tone } = STATUS_META[status];
  const cls = [
    styles.bar,
    styles[tone],
    continuesLeft && styles.contLeft,
    continuesRight && styles.contRight,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button
      type="button"
      className={cls}
      onClick={onClick}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      {continuesLeft && <span aria-hidden="true">&lt;</span>}
      <span aria-hidden="true" className={styles.shape}>
        {shape}
      </span>
      {title && (
        <span className={styles.barTitle} data-done={status === '완료' || undefined}>
          {title}
          {detail && <span className={styles.detail}> {detail}</span>}
        </span>
      )}
      {continuesRight && (
        <span aria-hidden="true" className={styles.right}>
          &gt;
        </span>
      )}
    </button>
  );
}
