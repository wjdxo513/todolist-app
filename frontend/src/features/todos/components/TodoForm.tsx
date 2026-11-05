import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { isApiError } from '../../../api/client';
import type { Todo } from '../../../api/types';
import { Button } from '../../../components/ui/Button';
import { DateField } from '../../../components/ui/DateField';
import { ErrorBanner } from '../../../components/ui/ErrorBanner';
import { TextField } from '../../../components/ui/TextField';
import { LIMITS } from '../../../lib/limits';
import { MESSAGES } from '../../../lib/messages';
import { ROUTES } from '../../../lib/routes';
import { toFieldErrors, type FieldErrors } from '../../auth';
import { useCategories } from '../../categories';
import { useCreateTodo, useUpdateTodo } from '../hooks';
import { END_BEFORE_START, todoFormSchema } from '../schemas';
import styles from './TodoForm.module.css';

interface Values {
  title: string;
  /** '' = 선택 안 함(기본 카테고리, BR-07) */
  categoryId: string;
  startDate: string;
  endDate: string;
  memo: string;
  isCompleted: boolean;
}

function initialValues(todo: Todo | undefined, defaultCategoryId: number | undefined): Values {
  if (!todo)
    return { title: '', categoryId: '', startDate: '', endDate: '', memo: '', isCompleted: false };
  return {
    title: todo.title,
    categoryId: todo.categoryId === defaultCategoryId ? '' : String(todo.categoryId),
    startDate: todo.startDate,
    endDate: todo.endDate,
    memo: todo.memo ?? '',
    isCompleted: todo.isCompleted,
  };
}

/** SC-06 할일 등록/편집(SN-07, SN-08, SN-14). todo가 있으면 편집 모드 */
export function TodoForm({ todo }: { todo?: Todo }) {
  const navigate = useNavigate();
  const categories = useCategories();
  const defaultCategory = categories.data?.find((c) => c.isDefault);
  const [values, setValues] = useState(() => initialValues(todo, defaultCategory?.id));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const create = useCreateTodo();
  const update = useUpdateTodo(todo?.id ?? 0);
  const isEdit = todo !== undefined;
  const isPending = create.isPending || update.isPending;

  const set = <K extends keyof Values>(key: K, value: Values[K]) =>
    setValues((s) => ({ ...s, [key]: value }));

  // 날짜를 바꿀 때마다 종료일 < 시작일을 바로 알린다(WA-13)
  const setDate = (key: 'startDate' | 'endDate', value: string) => {
    const next = { ...values, [key]: value };
    setValues(next);
    setErrors((e) => {
      const out: FieldErrors = { ...e };
      delete out[key];
      if (out.endDate === END_BEFORE_START) delete out.endDate;
      if (next.startDate && next.endDate && next.endDate < next.startDate)
        out.endDate = END_BEFORE_START;
      return out;
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const parsed = todoFormSchema.safeParse(values);
    if (!parsed.success) return setErrors(toFieldErrors(parsed.error));
    setErrors({});
    const body = {
      title: parsed.data.title,
      categoryId: values.categoryId ? Number(values.categoryId) : null, // 미지정 = null(BR-07)
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      memo: parsed.data.memo,
    };
    const onError = (err: unknown) => {
      if (isApiError(err) && err.fields) setErrors(err.fields);
      else setFormError(isApiError(err) && err.status !== 0 ? err.message : MESSAGES.generic);
    };
    const onSuccess = () => navigate(ROUTES.todos); // SA-09
    if (isEdit) update.mutate({ ...body, isCompleted: values.isCompleted }, { onSuccess, onError });
    else create.mutate(body, { onSuccess, onError });
  };

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>{isEdit ? '할일 편집' : '할일 등록'}</h1>
      <ErrorBanner message={formError} />
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <TextField
          label="제목"
          required
          value={values.title}
          onChange={(v) => set('title', v)}
          error={errors.title}
        />
        <div className={styles.field}>
          <label htmlFor="todo-category" className={styles.label}>
            카테고리
          </label>
          <select
            id="todo-category"
            className={styles.select}
            value={values.categoryId}
            onChange={(e) => set('categoryId', e.target.value)}
          >
            <option value="">선택 안 함 (기본 카테고리)</option>
            {categories.data
              ?.filter((c) => !c.isDefault)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
          {errors.categoryId && <p className={styles.error}>[!] {errors.categoryId}</p>}
        </div>
        <div className={styles.dates}>
          <DateField
            label="시작일"
            required
            value={values.startDate}
            onChange={(v) => setDate('startDate', v)}
            error={errors.startDate}
          />
          <DateField
            label="종료일"
            required
            value={values.endDate}
            onChange={(v) => setDate('endDate', v)}
            error={errors.endDate}
          />
        </div>
        <TextField
          label="메모"
          multiline
          value={values.memo}
          onChange={(v) => set('memo', v)}
          counterMax={LIMITS.MEMO_MAX}
          error={errors.memo}
        />
        {isEdit && (
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={values.isCompleted}
              onChange={(e) => set('isCompleted', e.target.checked)}
            />
            완료
          </label>
        )}
        <div className={styles.actions}>
          <Button type="submit" variant="primary" disabled={isPending}>
            저장
          </Button>
          <Button onClick={() => navigate(ROUTES.todos)}>취소</Button>
        </div>
      </form>
    </div>
  );
}
