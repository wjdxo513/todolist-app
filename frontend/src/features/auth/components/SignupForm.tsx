import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { isApiError } from '../../../api/client';
import { Button } from '../../../components/ui/Button';
import { ErrorBanner } from '../../../components/ui/ErrorBanner';
import { TextField } from '../../../components/ui/TextField';
import { LIMITS } from '../../../lib/limits';
import { MESSAGES } from '../../../lib/messages';
import { ROUTES } from '../../../lib/routes';
import { useSignup } from '../hooks';
import { signupSchema, toFieldErrors, type FieldErrors } from '../schemas';
import styles from './AuthCard.module.css';

/** SC-01 회원가입(SN-01) */
export function SignupForm() {
  const [values, setValues] = useState({ email: '', password: '', name: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const signup = useSignup();

  const set = (key: keyof typeof values) => (v: string) => setValues((s) => ({ ...s, [key]: v }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const parsed = signupSchema.safeParse(values);
    if (!parsed.success) return setErrors(toFieldErrors(parsed.error));
    setErrors({});
    signup.mutate(parsed.data, {
      onError: (err) => {
        // 서버 거부도 같은 필드 아래(FR-13). 409 이메일 중복은 fields.email로 온다
        if (isApiError(err) && err.fields) setErrors(err.fields);
        else setFormError(isApiError(err) ? err.message : MESSAGES.generic);
      },
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <span className={styles.brand}>TodoList</span>
        <h1 className={styles.title}>회원가입</h1>
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
            autoComplete="new-password"
            value={values.password}
            onChange={set('password')}
            hint={`${LIMITS.PASSWORD_MIN}자 이상`}
            error={errors.password}
          />
          <TextField
            label="이름"
            autoComplete="name"
            value={values.name}
            onChange={set('name')}
            error={errors.name}
          />
          <Button type="submit" variant="primary" disabled={signup.isPending}>
            가입
          </Button>
        </form>
        <p className={styles.footer}>
          이미 계정이 있나요? <Link to={ROUTES.login}>로그인</Link>
        </p>
      </div>
    </div>
  );
}
