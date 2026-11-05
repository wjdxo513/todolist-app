import { useState, type FormEvent } from 'react';
import { isApiError } from '../../../api/client';
import type { Category } from '../../../api/types';
import { Button } from '../../../components/ui/Button';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { ErrorBanner } from '../../../components/ui/ErrorBanner';
import { TextField } from '../../../components/ui/TextField';
import { MESSAGES } from '../../../lib/messages';
import { useCategories, useCreateCategory, useDeleteCategory, useRenameCategory } from '../hooks';
import { categoryNameSchema } from '../schemas';
import styles from './CategoryManager.module.css';

/** 필드 오류(입력 아래)와 영역 오류(화면 상단)를 나눈다(4번 문서 4.4) */
function splitError(err: unknown): { field?: string; banner?: string } {
  if (isApiError(err) && err.fields?.name) return { field: err.fields.name };
  if (isApiError(err) && err.code === 'CATEGORY_NAME_DUPLICATE') return { field: err.message };
  return { banner: isApiError(err) ? err.message : MESSAGES.generic };
}

function AddForm({ onBanner }: { onBanner: (m: string | null) => void }) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const create = useCreateCategory();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onBanner(null);
    const parsed = categoryNameSchema.safeParse(name);
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    setError(null);
    create.mutate(parsed.data, {
      onSuccess: () => setName(''),
      onError: (err) => {
        const { field, banner } = splitError(err);
        setError(field ?? null);
        onBanner(banner ?? null);
      },
    });
  };

  return (
    <form className={styles.add} onSubmit={handleSubmit} noValidate>
      <TextField label="새 카테고리" value={name} onChange={setName} error={error} />
      <Button type="submit" variant="primary" disabled={create.isPending}>
        추가
      </Button>
    </form>
  );
}

function CategoryRow({
  category,
  onDelete,
  onBanner,
}: {
  category: Category;
  onDelete: (c: Category) => void;
  onBanner: (m: string | null) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rename = useRenameCategory();

  const cancel = () => {
    setDraft(null);
    setError(null);
  };

  const save = (e: FormEvent) => {
    e.preventDefault();
    onBanner(null);
    const parsed = categoryNameSchema.safeParse(draft ?? '');
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    rename.mutate(
      { id: category.id, name: parsed.data },
      {
        onSuccess: cancel,
        onError: (err) => {
          const { field, banner } = splitError(err);
          setError(field ?? null);
          onBanner(banner ?? null);
        },
      },
    );
  };

  if (draft !== null) {
    return (
      <li className={styles.row}>
        <form className={styles.editForm} onSubmit={save} noValidate>
          <TextField
            label={`'${category.name}' 새 이름`}
            value={draft}
            onChange={setDraft}
            error={error}
          />
          <div className={styles.buttons}>
            <Button type="submit" size="sm" variant="primary" disabled={rename.isPending}>
              저장
            </Button>
            <Button size="sm" onClick={cancel}>
              취소
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className={styles.row}>
      <span className={styles.name}>
        {category.name}
        {category.isDefault && <span className={styles.tag}> (기본)</span>}
      </span>
      {category.isDefault ? (
        <span className={styles.muted}>수정·삭제 불가</span>
      ) : (
        <div className={styles.buttons}>
          <Button
            size="sm"
            onClick={() => setDraft(category.name)}
            aria-label={`${category.name} 수정`}
          >
            수정
          </Button>
          <Button size="sm" onClick={() => onDelete(category)} aria-label={`${category.name} 삭제`}>
            삭제
          </Button>
        </div>
      )}
    </li>
  );
}

/** SC-04 카테고리 관리(SN-06, WA-07, WA-08) */
export function CategoryManager() {
  const categories = useCategories();
  const remove = useDeleteCategory();
  const [target, setTarget] = useState<Category | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const confirmDelete = () => {
    if (!target) return;
    setBanner(null);
    remove.mutate(target.id, {
      onSettled: () => setTarget(null),
      onError: (err) => setBanner(isApiError(err) ? err.message : MESSAGES.generic),
    });
  };

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>카테고리 관리</h1>
      <ErrorBanner message={banner ?? (categories.isError ? MESSAGES.generic : null)} />
      <AddForm onBanner={setBanner} />
      <ul className={styles.list} aria-label="카테고리 목록">
        {categories.data?.map((c) => (
          <CategoryRow key={c.id} category={c} onDelete={setTarget} onBanner={setBanner} />
        ))}
      </ul>
      <ConfirmDialog
        open={target !== null}
        title="카테고리 삭제"
        message={
          <p>
            &apos;{target?.name}&apos; 카테고리를 삭제할까요? 소속 할일은 삭제되지 않고
            &apos;기본&apos; 카테고리로 이동합니다.
          </p>
        }
        onConfirm={confirmDelete}
        onCancel={() => setTarget(null)}
        isPending={remove.isPending}
      />
    </div>
  );
}
