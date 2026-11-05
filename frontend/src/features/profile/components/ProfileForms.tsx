import { useState, type FormEvent } from 'react';
import { z } from 'zod';
import { isApiError } from '../../../api/client';
import type { User } from '../../../api/types';
import { Button } from '../../../components/ui/Button';
import { ErrorBanner } from '../../../components/ui/ErrorBanner';
import { Notice } from '../../../components/ui/Notice';
import { TextField } from '../../../components/ui/TextField';
import { LIMITS } from '../../../lib/limits';
import { MESSAGES } from '../../../lib/messages';
import { passwordSchema, toFieldErrors, userNameSchema, type FieldErrors } from '../../auth';
import { useChangePassword, useUpdateMe } from '../hooks';
import styles from './ProfileForms.module.css';

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, '현재 비밀번호를 입력해 주세요.'),
  newPassword: passwordSchema,
});

const errorMessage = (err: unknown) => (isApiError(err) ? err.message : MESSAGES.generic);

function NameForm({ user }: { user: User }) {
  const [name, setName] = useState(user.name);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const update = useUpdateMe();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const parsed = userNameSchema.safeParse(name);
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    setError(null);
    update.mutate(
      { name: parsed.data },
      {
        onError: (err) =>
          isApiError(err) && err.fields?.name
            ? setError(err.fields.name)
            : setFormError(errorMessage(err)),
      },
    );
  };

  return (
    <form
      className={styles.section}
      onSubmit={handleSubmit}
      noValidate
      aria-labelledby="profile-basic"
    >
      <h2 id="profile-basic" className={styles.heading}>
        기본 정보
      </h2>
      <ErrorBanner message={formError} />
      <TextField label="이메일" value={user.email} readOnly hint="변경할 수 없습니다" />
      <TextField
        label="이름"
        value={name}
        onChange={(v) => {
          setName(v);
          update.reset();
        }}
        error={error}
      />
      <div className={styles.actions}>
        <Button type="submit" variant="primary" disabled={update.isPending}>
          이름 저장
        </Button>
        <Notice message={update.isSuccess ? '저장되었습니다.' : null} />
      </div>
    </form>
  );
}

function PasswordForm() {
  const empty = { currentPassword: '', newPassword: '' };
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const change = useChangePassword();

  const set = (key: keyof typeof values) => (v: string) => {
    setValues((s) => ({ ...s, [key]: v }));
    change.reset();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const parsed = passwordFormSchema.safeParse(values);
    if (!parsed.success) return setErrors(toFieldErrors(parsed.error));
    setErrors({});
    change.mutate(parsed.data, {
      onSuccess: () => setValues(empty), // 로그인 상태 유지(WA-06)
      onError: (err) => {
        setValues(empty); // 실패 후 비밀번호 필드는 비운다(5.4)
        if (isApiError(err) && err.fields)
          setErrors(err.fields); // D-06: fields.currentPassword
        else if (isApiError(err) && err.code === 'INVALID_CREDENTIALS')
          setErrors({ currentPassword: '현재 비밀번호가 일치하지 않습니다.' });
        else setFormError(errorMessage(err));
      },
    });
  };

  return (
    <form
      className={styles.section}
      onSubmit={handleSubmit}
      noValidate
      aria-labelledby="profile-password"
    >
      <h2 id="profile-password" className={styles.heading}>
        비밀번호 변경
      </h2>
      <ErrorBanner message={formError} />
      <TextField
        label="현재 비밀번호"
        type="password"
        autoComplete="current-password"
        value={values.currentPassword}
        onChange={set('currentPassword')}
        error={errors.currentPassword}
      />
      <TextField
        label="새 비밀번호"
        type="password"
        autoComplete="new-password"
        value={values.newPassword}
        onChange={set('newPassword')}
        hint={`${LIMITS.PASSWORD_MIN}자 이상`}
        error={errors.newPassword}
      />
      <div className={styles.actions}>
        <Button type="submit" variant="accent" disabled={change.isPending}>
          비밀번호 변경
        </Button>
        <Notice message={change.isSuccess ? '비밀번호가 변경되었습니다.' : null} />
      </div>
    </form>
  );
}

/** SC-03 내 정보(SN-05). 이름 저장과 비밀번호 변경은 별개 요청(WA-06) */
export function ProfileForms({ user }: { user: User }) {
  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>내 정보</h1>
      <NameForm user={user} />
      <PasswordForm />
    </div>
  );
}
