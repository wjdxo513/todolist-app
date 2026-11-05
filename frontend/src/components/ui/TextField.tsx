import { useId, type ReactNode } from 'react';
import styles from './Field.module.css';

interface TextFieldProps {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  type?: 'text' | 'email' | 'password';
  error?: string | null;
  hint?: ReactNode;
  required?: boolean;
  readOnly?: boolean;
  multiline?: boolean;
  /** 글자 수 카운터 최대값(메모, WA-22) */
  counterMax?: number;
  autoComplete?: string;
  name?: string;
}

/** 라벨·입력·오류 문구(4번 문서 5.4). 오류는 입력 바로 아래 '[!]' 접두로 표시 */
export function TextField({
  label,
  value,
  onChange,
  type = 'text',
  error,
  hint,
  required,
  readOnly,
  multiline,
  counterMax,
  autoComplete,
  name,
}: TextFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const common = {
    id,
    name,
    value,
    readOnly,
    required,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? errorId : undefined,
    className: [styles.input, error && styles.invalid].filter(Boolean).join(' '),
  };
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {multiline ? (
        <textarea {...common} rows={4} onChange={(e) => onChange?.(e.target.value)} />
      ) : (
        <input
          {...common}
          type={type}
          autoComplete={autoComplete}
          onChange={(e) => onChange?.(e.target.value)}
        />
      )}
      {(hint || counterMax !== undefined) && (
        <div className={styles.meta}>
          {hint && <span className={styles.hint}>{hint}</span>}
          {counterMax !== undefined && (
            <span className={styles.counter}>
              {value.length} / {counterMax}
            </span>
          )}
        </div>
      )}
      {error && (
        <p id={errorId} className={styles.error}>
          [!] {error}
        </p>
      )}
    </div>
  );
}
