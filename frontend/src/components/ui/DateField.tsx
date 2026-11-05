import { useId } from 'react';
import styles from './Field.module.css';

interface DateFieldProps {
  label: string;
  /** 'YYYY-MM-DD' 또는 빈 문자열 */
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  required?: boolean;
}

/**
 * 날짜 입력(D-03: 네이티브 date input, 직접 입력은 브라우저 기본 동작).
 * 값은 항상 'YYYY-MM-DD' 문자열이라 타임존 변환이 없다(CP-03). min을 두지 않아
 * 시작일보다 이른 종료일 선택을 막지 않는다(WA-13).
 */
export function DateField({ label, value, onChange, error, required }: DateFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <input
        id={id}
        type="date"
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={[styles.input, error && styles.invalid].filter(Boolean).join(' ')}
      />
      {error && (
        <p id={errorId} className={styles.error}>
          [!] {error}
        </p>
      )}
    </div>
  );
}
