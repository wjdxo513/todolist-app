import { Button } from './Button';
import styles from './Pagination.module.css';

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

/** 페이지 이동(4번 문서 5.5). 데스크톱은 번호, 모바일은 '현재 / 전체' */
export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <nav aria-label="페이지 이동" className={styles.nav}>
      <Button size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        &lt; 이전
      </Button>
      <ol className={styles.numbers}>
        {pages.map((p) => (
          <li key={p}>
            <Button
              size="sm"
              variant={p === page ? 'primary' : 'secondary'}
              aria-current={p === page ? 'page' : undefined}
              aria-label={`${p}페이지`}
              onClick={() => onChange(p)}
            >
              {p}
            </Button>
          </li>
        ))}
      </ol>
      <span className={styles.compact}>
        {page} / {totalPages}
      </span>
      <Button size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        다음 &gt;
      </Button>
    </nav>
  );
}
