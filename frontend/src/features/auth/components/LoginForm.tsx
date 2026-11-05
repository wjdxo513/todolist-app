import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router';
import { isApiError } from '../../../api/client';
import { Button } from '../../../components/ui/Button';
import { ErrorBanner } from '../../../components/ui/ErrorBanner';
import { Notice } from '../../../components/ui/Notice';
import { TextField } from '../../../components/ui/TextField';
import { MESSAGES } from '../../../lib/messages';
import { ROUTES } from '../../../lib/routes';
import { useSessionStore } from '../../../stores/sessionStore';
import { useLogin } from '../hooks';
import { loginSchema, toFieldErrors, type FieldErrors } from '../schemas';
import styles from './AuthCard.module.css';

function loginErrorMessage(err: unknown): string {
  if (!isApiError(err)) return MESSAGES.generic;
  if (err.code === 'INVALID_CREDENTIALS') return MESSAGES.invalidCredentials;
  if (err.code === 'TOO_MANY_ATTEMPTS') return MESSAGES.tooManyAttempts;
  return err.status === 0 ? err.message : MESSAGES.generic;
}

/** SC-02 로그인(SN-02, SN-03, WA-02, WA-03, WA-21) */
export function LoginForm() {
  const location = useLocation();
  const isExpired = useSessionStore((s) => s.isExpired);
  const signedUp = (location.state as { signedUp?: boolean } | null)?.signedUp === true;
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const login = useLogin();

  const set = (key: keyof typeof values) => (v: string) => setValues((s) => ({ ...s, [key]: v }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) return setErrors(toFieldErrors(parsed.error));
    setErrors({});
    login.mutate(parsed.data, {
      onError: (err) => {
        if (isApiError(err) && err.status === 400 && err.fields) setErrors(err.fields);
        else setFormError(loginErrorMessage(err));
        setValues((s) => ({ ...s, password: '' })); // 실패 후 비밀번호는 비운다(5.4)
      },
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <span className={styles.brand}>TodoList</span>
        <h1 className={styles.title}>로그인</h1>
        <Notice message={signedUp ? MESSAGES.signedUp : null} />
        <Notice message={isExpired ? MESSAGES.sessionExpired : null} />
        <ErrorBanner message={formError} />
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <TextField
            label="이메일"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={set('email')}
            error={errors.email}
          />
          <TextField
            label="비밀번호"
            type="password"
            autoComplete="current-password"
            value={values.password}
            onChange={set('password')}
            error={errors.password}
          />
          <Button type="submit" variant="primary" disabled={login.isPending}>
            로그인
          </Button>
        </form>
        <p className={styles.footer}>
          계정이 없나요? <Link to={ROUTES.signup}>회원가입</Link>
        </p>
      </div>
    </div>
  );
}
